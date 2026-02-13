import Coupon from "../models/couponModel.js";
import Payment from "../models/paymentModel.js";
import { SettingsRepository } from "../repositories/settingsRepository.js";
import { ApiError, NotFoundError, ValidationError } from "../utils/apiError.js";

const ACTIVE_USAGE_STATUSES = ["pending", "processing", "success", "delivered"];
const SUCCESS_USAGE_STATUSES = ["success", "delivered"];

class CouponService {
  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  normalizeCode(code) {
    return String(code || "")
      .trim()
      .toUpperCase();
  }

  normalizeCurrency(currency, fallback = "EGP") {
    if (currency === "EGP" || currency === "SAR" || currency === "USD") {
      return currency;
    }
    return fallback;
  }

  roundMoney(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  getExchangeRatesMap(settings) {
    return {
      USD: Number(settings?.financeSettings?.exchangeRates?.USD) || 1,
      SAR: Number(settings?.financeSettings?.exchangeRates?.SAR) || 3.75,
      EGP: Number(settings?.financeSettings?.exchangeRates?.EGP) || 50,
    };
  }

  convertAmount(amount, fromCurrency, toCurrency, exchangeRates) {
    if (fromCurrency === toCurrency) {
      return this.roundMoney(amount);
    }

    const fromRate = Number(exchangeRates?.[fromCurrency]);
    const toRate = Number(exchangeRates?.[toCurrency]);

    if (!fromRate || !toRate) {
      throw new ApiError(400, "Invalid currency conversion rates");
    }

    const amountInUsd = Number(amount) / fromRate;
    return this.roundMoney(amountInUsd * toRate);
  }

  parseNullableNumber(value) {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  }

  parseNullableDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  parseReportDate(value, endOfDay = false) {
    if (!value) return null;
    const raw = String(value).trim();

    if (!raw) return null;

    let parsed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      parsed = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
    } else {
      parsed = new Date(raw);
    }

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  buildReportDateRange(startDate, endDate) {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 30);

    if (!startDate && !endDate) {
      return {
        startDate: defaultStart,
        endDate: now,
        filter: { $gte: defaultStart, $lte: now },
      };
    }

    const parsedStart = this.parseReportDate(startDate, false);
    const parsedEnd = this.parseReportDate(endDate, true);

    if (startDate && !parsedStart) {
      throw new ValidationError("Invalid startDate");
    }

    if (endDate && !parsedEnd) {
      throw new ValidationError("Invalid endDate");
    }

    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      throw new ValidationError("startDate cannot be after endDate");
    }

    const filter = {};
    if (parsedStart) filter.$gte = parsedStart;
    if (parsedEnd) filter.$lte = parsedEnd;

    return {
      startDate: parsedStart || defaultStart,
      endDate: parsedEnd || now,
      filter: Object.keys(filter).length ? filter : { $gte: defaultStart, $lte: now },
    };
  }

  sanitizeCouponPayload(data) {
    const payload = {};

    if (data.code !== undefined) payload.code = this.normalizeCode(data.code);
    if (data.description !== undefined) {
      payload.description = String(data.description || "").trim();
    }
    if (data.discountType !== undefined) payload.discountType = data.discountType;
    if (data.discountValue !== undefined) {
      payload.discountValue = Number(data.discountValue);
    }
    if (data.maxDiscountAmount !== undefined) {
      payload.maxDiscountAmount = this.parseNullableNumber(data.maxDiscountAmount);
    }
    if (data.minOrderAmount !== undefined) {
      payload.minOrderAmount = Number(data.minOrderAmount || 0);
    }
    if (data.currency !== undefined) {
      payload.currency = this.normalizeCurrency(data.currency, "EGP");
    }
    if (data.appliesTo !== undefined) payload.appliesTo = data.appliesTo;
    if (data.usageLimit !== undefined) {
      payload.usageLimit = this.parseNullableNumber(data.usageLimit);
    }
    if (data.perUserLimit !== undefined) {
      payload.perUserLimit = this.parseNullableNumber(data.perUserLimit);
    }
    if (data.startsAt !== undefined) {
      payload.startsAt = this.parseNullableDate(data.startsAt);
    }
    if (data.expiresAt !== undefined) {
      payload.expiresAt = this.parseNullableDate(data.expiresAt);
    }
    if (data.isActive !== undefined) payload.isActive = !!data.isActive;

    return payload;
  }

  async getCouponUsageStats(codes = []) {
    if (!codes.length) return {};

    const usage = await Payment.aggregate([
      {
        $match: {
          couponCode: { $in: codes },
          status: { $in: ACTIVE_USAGE_STATUSES },
        },
      },
      {
        $group: {
          _id: "$couponCode",
          totalUses: { $sum: 1 },
        },
      },
    ]);

    return usage.reduce((acc, item) => {
      acc[item._id] = item.totalUses;
      return acc;
    }, {});
  }

  async getAllCoupons(filters = {}) {
    const query = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === true || filters.isActive === "true";
    }

    if (filters.search) {
      query.code = { $regex: String(filters.search).trim(), $options: "i" };
    }

    const coupons = await Coupon.find(query)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .sort({ createdAt: -1 });

    const usageMap = await this.getCouponUsageStats(coupons.map((coupon) => coupon.code));

    return coupons.map((coupon) => ({
      ...coupon.toJSON(),
      usageCount: usageMap[coupon.code] || 0,
    }));
  }

  async getCouponById(id) {
    const coupon = await Coupon.findById(id)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email");

    if (!coupon) throw new NotFoundError("Coupon");

    const usageMap = await this.getCouponUsageStats([coupon.code]);

    return {
      ...coupon.toJSON(),
      usageCount: usageMap[coupon.code] || 0,
    };
  }

  async createCoupon(data, userId) {
    const payload = this.sanitizeCouponPayload(data);

    if (!payload.code) {
      throw new ValidationError("Coupon code is required");
    }

    const existing = await Coupon.findOne({ code: payload.code });
    if (existing) {
      throw new ValidationError("Coupon code already exists");
    }

    const coupon = await Coupon.create({
      ...payload,
      createdBy: userId,
    });

    return coupon;
  }

  async updateCoupon(id, data, userId) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new NotFoundError("Coupon");

    const payload = this.sanitizeCouponPayload(data);

    if (payload.code && payload.code !== coupon.code) {
      const existing = await Coupon.findOne({ code: payload.code });
      if (existing) {
        throw new ValidationError("Coupon code already exists");
      }
    }

    Object.keys(payload).forEach((key) => {
      coupon[key] = payload[key];
    });
    coupon.updatedBy = userId;

    await coupon.save();
    return coupon;
  }

  async deleteCoupon(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new NotFoundError("Coupon");
    await Coupon.deleteOne({ _id: coupon._id });
    return { message: "Coupon deleted successfully" };
  }

  async getCouponReport({ startDate, endDate, currency, limit } = {}) {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const settings = await this.settingsRepository.getSettings();
    const exchangeRates = this.getExchangeRatesMap(settings);
    const baseCurrency = this.normalizeCurrency(
      settings?.financeSettings?.baseCurrency,
      "EGP"
    );
    const reportCurrency = this.normalizeCurrency(currency, baseCurrency);
    const topLimit = Math.min(Math.max(Number(limit) || 8, 1), 50);

    const reportRange = this.buildReportDateRange(startDate, endDate);

    const usageMatch = {
      couponCode: { $exists: true, $nin: [null, ""] },
      status: { $in: ACTIVE_USAGE_STATUSES },
      createdAt: reportRange.filter,
    };

    const successMatch = {
      couponCode: { $exists: true, $nin: [null, ""] },
      status: { $in: SUCCESS_USAGE_STATUSES },
      createdAt: reportRange.filter,
    };

    const [
      totalCoupons,
      activeCoupons,
      currentlyValidCoupons,
      scheduledCoupons,
      expiredCoupons,
      expiringSoonCoupons,
      usageRows,
      trendRows,
      contextRows,
    ] = await Promise.all([
      Coupon.countDocuments({}),
      Coupon.countDocuments({ isActive: true }),
      Coupon.countDocuments({
        isActive: true,
        $and: [
          {
            $or: [
              { startsAt: null },
              { startsAt: { $exists: false } },
              { startsAt: { $lte: now } },
            ],
          },
          {
            $or: [
              { expiresAt: null },
              { expiresAt: { $exists: false } },
              { expiresAt: { $gte: now } },
            ],
          },
        ],
      }),
      Coupon.countDocuments({ isActive: true, startsAt: { $gt: now } }),
      Coupon.countDocuments({ expiresAt: { $lt: now } }),
      Coupon.countDocuments({
        isActive: true,
        expiresAt: { $gte: now, $lte: sevenDaysLater },
      }),
      Payment.aggregate([
        { $match: usageMatch },
        {
          $group: {
            _id: { code: "$couponCode", currency: "$currency" },
            totalUses: { $sum: 1 },
            successfulUses: {
              $sum: {
                $cond: [{ $in: ["$status", SUCCESS_USAGE_STATUSES] }, 1, 0],
              },
            },
            totalDiscount: {
              $sum: {
                $cond: [
                  { $in: ["$status", SUCCESS_USAGE_STATUSES] },
                  { $ifNull: ["$discountAmount", 0] },
                  0,
                ],
              },
            },
            totalNetRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", SUCCESS_USAGE_STATUSES] },
                  { $ifNull: ["$amount", 0] },
                  0,
                ],
              },
            },
            totalGrossRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", SUCCESS_USAGE_STATUSES] },
                  {
                    $ifNull: [
                      "$originalAmount",
                      {
                        $add: [
                          { $ifNull: ["$amount", 0] },
                          { $ifNull: ["$discountAmount", 0] },
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
      Payment.aggregate([
        { $match: successMatch },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              currency: "$currency",
            },
            uses: { $sum: 1 },
            totalDiscount: { $sum: { $ifNull: ["$discountAmount", 0] } },
            totalNetRevenue: { $sum: { $ifNull: ["$amount", 0] } },
            totalGrossRevenue: {
              $sum: {
                $ifNull: [
                  "$originalAmount",
                  {
                    $add: [
                      { $ifNull: ["$amount", 0] },
                      { $ifNull: ["$discountAmount", 0] },
                    ],
                  },
                ],
              },
            },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
      Payment.aggregate([
        { $match: usageMatch },
        {
          $group: {
            _id: {
              context: {
                $cond: [{ $ne: ["$packageId", null] }, "package", "checkout"],
              },
              currency: "$currency",
            },
            totalUses: { $sum: 1 },
            successfulUses: {
              $sum: {
                $cond: [{ $in: ["$status", SUCCESS_USAGE_STATUSES] }, 1, 0],
              },
            },
            totalDiscount: {
              $sum: {
                $cond: [
                  { $in: ["$status", SUCCESS_USAGE_STATUSES] },
                  { $ifNull: ["$discountAmount", 0] },
                  0,
                ],
              },
            },
            totalNetRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", SUCCESS_USAGE_STATUSES] },
                  { $ifNull: ["$amount", 0] },
                  0,
                ],
              },
            },
            totalGrossRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", SUCCESS_USAGE_STATUSES] },
                  {
                    $ifNull: [
                      "$originalAmount",
                      {
                        $add: [
                          { $ifNull: ["$amount", 0] },
                          { $ifNull: ["$discountAmount", 0] },
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const convertValue = (value, rowCurrency) => {
      const numericValue = Number(value || 0);
      if (!Number.isFinite(numericValue) || numericValue === 0) return 0;

      try {
        return this.convertAmount(
          numericValue,
          this.normalizeCurrency(rowCurrency, reportCurrency),
          reportCurrency,
          exchangeRates
        );
      } catch (error) {
        return this.roundMoney(numericValue);
      }
    };

    const usageByCode = new Map();

    usageRows.forEach((row) => {
      const code = this.normalizeCode(row?._id?.code);
      if (!code) return;

      if (!usageByCode.has(code)) {
        usageByCode.set(code, {
          code,
          totalUses: 0,
          successfulUses: 0,
          totalDiscount: 0,
          totalNetRevenue: 0,
          totalGrossRevenue: 0,
        });
      }

      const item = usageByCode.get(code);
      const rowCurrency = row?._id?.currency;

      item.totalUses += Number(row.totalUses || 0);
      item.successfulUses += Number(row.successfulUses || 0);
      item.totalDiscount += convertValue(row.totalDiscount, rowCurrency);
      item.totalNetRevenue += convertValue(row.totalNetRevenue, rowCurrency);
      item.totalGrossRevenue += convertValue(row.totalGrossRevenue, rowCurrency);
    });

    const usedCodes = Array.from(usageByCode.keys());
    const coupons = usedCodes.length
      ? await Coupon.find({ code: { $in: usedCodes } })
        .select(
          "code isActive usageLimit startsAt expiresAt appliesTo discountType discountValue"
        )
        .lean()
      : [];

    const couponMap = coupons.reduce((acc, coupon) => {
      acc[coupon.code] = coupon;
      return acc;
    }, {});

    const couponRows = Array.from(usageByCode.values()).map((item) => {
      const coupon = couponMap[item.code];
      const usageLimit =
        coupon?.usageLimit === null || coupon?.usageLimit === undefined
          ? null
          : Number(coupon.usageLimit);
      const remainingUses =
        usageLimit === null ? null : Math.max(usageLimit - item.totalUses, 0);
      const successRate =
        item.totalUses > 0
          ? this.roundMoney((item.successfulUses / item.totalUses) * 100)
          : 0;
      const avgDiscountPerUse =
        item.successfulUses > 0
          ? this.roundMoney(item.totalDiscount / item.successfulUses)
          : 0;
      const avgDiscountRate =
        item.totalGrossRevenue > 0
          ? this.roundMoney((item.totalDiscount / item.totalGrossRevenue) * 100)
          : 0;

      return {
        code: item.code,
        isActive: !!coupon?.isActive,
        appliesTo: coupon?.appliesTo || "all",
        discountType: coupon?.discountType || null,
        discountValue: Number(coupon?.discountValue || 0),
        startsAt: coupon?.startsAt || null,
        expiresAt: coupon?.expiresAt || null,
        usageLimit,
        remainingUses,
        totalUses: item.totalUses,
        successfulUses: item.successfulUses,
        successRate,
        totalDiscount: this.roundMoney(item.totalDiscount),
        totalNetRevenue: this.roundMoney(item.totalNetRevenue),
        totalGrossRevenue: this.roundMoney(item.totalGrossRevenue),
        avgDiscountPerUse,
        avgDiscountRate,
      };
    });

    couponRows.sort((a, b) => {
      if (b.totalDiscount !== a.totalDiscount) {
        return b.totalDiscount - a.totalDiscount;
      }
      if (b.successfulUses !== a.successfulUses) {
        return b.successfulUses - a.successfulUses;
      }
      return b.totalUses - a.totalUses;
    });

    const topCoupons = couponRows.slice(0, topLimit);

    const totals = couponRows.reduce(
      (acc, row) => {
        acc.totalRedemptions += row.totalUses;
        acc.successfulRedemptions += row.successfulUses;
        acc.totalDiscount += row.totalDiscount;
        acc.totalNetRevenue += row.totalNetRevenue;
        acc.totalGrossRevenue += row.totalGrossRevenue;
        return acc;
      },
      {
        totalRedemptions: 0,
        successfulRedemptions: 0,
        totalDiscount: 0,
        totalNetRevenue: 0,
        totalGrossRevenue: 0,
      }
    );

    const dailyMap = new Map();
    trendRows.forEach((row) => {
      const date = row?._id?.date;
      if (!date) return;

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          uses: 0,
          totalDiscount: 0,
          totalNetRevenue: 0,
          totalGrossRevenue: 0,
        });
      }

      const item = dailyMap.get(date);
      const rowCurrency = row?._id?.currency;

      item.uses += Number(row.uses || 0);
      item.totalDiscount += convertValue(row.totalDiscount, rowCurrency);
      item.totalNetRevenue += convertValue(row.totalNetRevenue, rowCurrency);
      item.totalGrossRevenue += convertValue(row.totalGrossRevenue, rowCurrency);
    });

    const dailyTrend = Array.from(dailyMap.values())
      .map((row) => ({
        date: row.date,
        uses: row.uses,
        totalDiscount: this.roundMoney(row.totalDiscount),
        totalNetRevenue: this.roundMoney(row.totalNetRevenue),
        totalGrossRevenue: this.roundMoney(row.totalGrossRevenue),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const contextMap = new Map();
    contextRows.forEach((row) => {
      const context = row?._id?.context === "package" ? "package" : "checkout";
      if (!contextMap.has(context)) {
        contextMap.set(context, {
          context,
          totalUses: 0,
          successfulUses: 0,
          totalDiscount: 0,
          totalNetRevenue: 0,
          totalGrossRevenue: 0,
        });
      }

      const item = contextMap.get(context);
      const rowCurrency = row?._id?.currency;

      item.totalUses += Number(row.totalUses || 0);
      item.successfulUses += Number(row.successfulUses || 0);
      item.totalDiscount += convertValue(row.totalDiscount, rowCurrency);
      item.totalNetRevenue += convertValue(row.totalNetRevenue, rowCurrency);
      item.totalGrossRevenue += convertValue(row.totalGrossRevenue, rowCurrency);
    });

    const contextBreakdown = Array.from(contextMap.values())
      .map((row) => ({
        context: row.context,
        totalUses: row.totalUses,
        successfulUses: row.successfulUses,
        successRate:
          row.totalUses > 0
            ? this.roundMoney((row.successfulUses / row.totalUses) * 100)
            : 0,
        totalDiscount: this.roundMoney(row.totalDiscount),
        totalNetRevenue: this.roundMoney(row.totalNetRevenue),
        totalGrossRevenue: this.roundMoney(row.totalGrossRevenue),
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount);

    const usedCoupons = couponRows.length;
    const totalRedemptions = totals.totalRedemptions;
    const successfulRedemptions = totals.successfulRedemptions;

    return {
      period: {
        startDate: reportRange.startDate.toISOString(),
        endDate: reportRange.endDate.toISOString(),
      },
      currency: reportCurrency,
      overview: {
        totalCoupons,
        activeCoupons,
        inactiveCoupons: Math.max(totalCoupons - activeCoupons, 0),
        currentlyValidCoupons,
        scheduledCoupons,
        expiredCoupons,
        expiringSoonCoupons,
        usedCoupons,
        utilizationRate:
          totalCoupons > 0
            ? this.roundMoney((usedCoupons / totalCoupons) * 100)
            : 0,
        totalRedemptions,
        successfulRedemptions,
        successRate:
          totalRedemptions > 0
            ? this.roundMoney((successfulRedemptions / totalRedemptions) * 100)
            : 0,
        totalDiscountAmount: this.roundMoney(totals.totalDiscount),
        totalNetRevenue: this.roundMoney(totals.totalNetRevenue),
        totalGrossRevenue: this.roundMoney(totals.totalGrossRevenue),
        avgDiscountPerRedemption:
          successfulRedemptions > 0
            ? this.roundMoney(totals.totalDiscount / successfulRedemptions)
            : 0,
        avgOrderValueAfterDiscount:
          successfulRedemptions > 0
            ? this.roundMoney(totals.totalNetRevenue / successfulRedemptions)
            : 0,
        avgDiscountRate:
          totals.totalGrossRevenue > 0
            ? this.roundMoney((totals.totalDiscount / totals.totalGrossRevenue) * 100)
            : 0,
      },
      topCoupons,
      dailyTrend,
      contextBreakdown,
    };
  }

  async validateCouponForOrder({
    code,
    amount,
    currency = "EGP",
    context = "checkout",
    userId = null,
  }) {
    const normalizedCode = this.normalizeCode(code);
    if (!normalizedCode) {
      throw new ValidationError("Coupon code is required");
    }

    const orderAmount = this.roundMoney(amount);
    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      throw new ValidationError("Invalid order amount");
    }

    const orderCurrency = this.normalizeCurrency(currency, "EGP");
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    if (!coupon.isActive) {
      throw new ValidationError("Coupon is inactive");
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new ValidationError("Coupon is not active yet");
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new ValidationError("Coupon has expired");
    }

    if (coupon.appliesTo !== "all" && coupon.appliesTo !== context) {
      throw new ValidationError("Coupon is not valid for this checkout");
    }

    const settings = await this.settingsRepository.getSettings();
    const exchangeRates = this.getExchangeRatesMap(settings);

    const minOrderAmountInOrderCurrency = this.convertAmount(
      Number(coupon.minOrderAmount || 0),
      this.normalizeCurrency(coupon.currency, "EGP"),
      orderCurrency,
      exchangeRates
    );

    if (orderAmount < minOrderAmountInOrderCurrency) {
      throw new ValidationError(
        `Minimum order amount is ${minOrderAmountInOrderCurrency} ${orderCurrency}`
      );
    }

    const usageFilter = {
      couponCode: normalizedCode,
      status: { $in: ACTIVE_USAGE_STATUSES },
    };

    const totalUses = await Payment.countDocuments(usageFilter);
    if (coupon.usageLimit && totalUses >= coupon.usageLimit) {
      throw new ValidationError("Coupon usage limit reached");
    }

    let userUses = 0;
    if (coupon.perUserLimit) {
      if (!userId) {
        throw new ValidationError("Login is required to use this coupon");
      }
      userUses = await Payment.countDocuments({
        ...usageFilter,
        userId,
      });
      if (userUses >= coupon.perUserLimit) {
        throw new ValidationError("You have reached this coupon usage limit");
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = this.roundMoney((orderAmount * Number(coupon.discountValue || 0)) / 100);

      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        const maxDiscountInOrderCurrency = this.convertAmount(
          coupon.maxDiscountAmount,
          this.normalizeCurrency(coupon.currency, "EGP"),
          orderCurrency,
          exchangeRates
        );
        discountAmount = Math.min(discountAmount, maxDiscountInOrderCurrency);
      }
    } else {
      const fixedDiscountInOrderCurrency = this.convertAmount(
        Number(coupon.discountValue || 0),
        this.normalizeCurrency(coupon.currency, "EGP"),
        orderCurrency,
        exchangeRates
      );
      discountAmount = this.roundMoney(Math.min(orderAmount, fixedDiscountInOrderCurrency));
    }

    if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
      throw new ValidationError("Coupon does not apply to this order");
    }

    const finalAmount = this.roundMoney(Math.max(orderAmount - discountAmount, 0));

    return {
      coupon,
      code: normalizedCode,
      originalAmount: orderAmount,
      discountAmount,
      finalAmount,
      currency: orderCurrency,
      context,
      usage: {
        totalUses,
        usageLimit: coupon.usageLimit,
        userUses,
        perUserLimit: coupon.perUserLimit,
      },
      snapshot: {
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minOrderAmount: coupon.minOrderAmount,
        currency: coupon.currency,
        appliesTo: coupon.appliesTo,
      },
    };
  }
}

export default new CouponService();
