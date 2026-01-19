export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    const {
      filter = {},
      sort = { createdAt: -1 },
      page = 1,
      limit = 10,
      populate = "",
      select = "",
    } = options;

    const skip = (page - 1) * limit;

    const query = this.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number.parseInt(limit));

    if (populate) {
      query.populate(populate);
    }

    if (select) {
      query.select(select);
    }

    const [results, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      results,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id, options = {}) {
    const { populate = "", select = "" } = options;

    let query = this.model.findById(id);

    if (populate) {
      query = query.populate(populate);
    }

    if (select) {
      query = query.select(select);
    }

    return query.exec();
  }

  async findOne(filter, options = {}) {
    const { populate = "", select = "" } = options;

    let query = this.model.findOne(filter);

    if (populate) {
      query = query.populate(populate);
    }

    if (select) {
      query = query.select(select);
    }

    return query.exec();
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async exists(filter) {
    return this.model.exists(filter);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async bulkUpdate(filter, update) {
    return this.model.updateMany(filter, update);
  }
}
