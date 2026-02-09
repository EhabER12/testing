# Currency Switching System - Implementation Guide

## Overview
A comprehensive currency switching system that allows users to view prices in SAR, EGP, or USD with automatic conversion based on admin-configured exchange rates.

## Components

### 1. CurrencyProvider (`contexts/CurrencyContext.tsx`)
Global context that manages currency state and provides conversion utilities.

### 2. CurrencySwitcher (`components/currency/CurrencySwitcher.tsx`)
Interactive UI component for switching currencies.

**Variants:**
- `default`: Full display with flag, currency code, and label
- `minimal`: Compact version with flag and code
- `icon-only`: Just a dollar sign icon

### 3. PriceDisplay (`components/currency/PriceDisplay.tsx`)
Automatic price display with conversion and formatting.

## Usage Examples

### In Navigation/Header
```tsx
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";

export function Header() {
  const locale = "en"; // or "ar"
  
  return (
    <header>
      {/* Other header content */}
      <CurrencySwitcher locale={locale} variant="minimal" />
    </header>
  );
}
```

### In Course Card
```tsx
import { PriceDisplay } from "@/components/currency/PriceDisplay";

export function CourseCard({ course }) {
  return (
    <div>
      <h3>{course.title}</h3>
      <PriceDisplay
        amount={course.price}
        currency={course.currency}
        locale="en"
        showOriginal={true}
      />
    </div>
  );
}
```

### Direct Currency Conversion
```tsx
import { useCurrencyContext } from "@/contexts/CurrencyContext";

export function CheckoutPage() {
  const { convert, format, selectedCurrency } = useCurrencyContext();
  
  const originalPrice = 100; // SAR
  const convertedPrice = convert(originalPrice, "SAR");
  const formattedPrice = format(convertedPrice, selectedCurrency, "en");
  
  return <div>Price: {formattedPrice}</div>;
}
```

## Admin Configuration

Exchange rates and base currency are managed in the admin dashboard:
- **Location**: Dashboard > Settings > Finance Settings
- **Fields**:
  - Base Currency (SAR, EGP, USD)
  - Exchange Rates (USD, SAR, EGP)
  - Last Update timestamp

## Integration Points

### 1. Course Listings
Replace manual price displays with `<PriceDisplay>` component.

### 2. Product Cards
Use `useCurrencyContext` for dynamic pricing.

### 3. Checkout Pages
Automatic conversion ensures correct pricing at checkout.

### 4. Navigation
Add `<CurrencySwitcher>` to header for easy access.

## Technical Details

### Exchange Rate Logic
- All conversions go through USD as the base
- Formula: `(amount / fromRate) * toRate`
- Results rounded to 2 decimal places

### Persistence
- Selected currency saved in `localStorage`
- Persists across sessions
- Defaults to admin-configured base currency

### RTL Support
- Automatic symbol positioning for Arabic/English
- Currency names in both languages
- Proper text direction handling

## API Endpoints

**Get Public Settings (includes currency):**
```
GET /api/settings/public
Response: { financeSettings: { baseCurrency, exchangeRates } }
```

**Update Currency Settings (Admin):**
```
PUT /api/settings
Body: { financeSettings: { baseCurrency, exchangeRates } }
```

## Browser Compatibility
- LocalStorage for persistence
- Modern React hooks
- Responsive design
- Supports all major browsers

## Performance
- Single API call on app load
- Cached in React context
- No re-renders unless currency changes
- Lightweight bundle size
