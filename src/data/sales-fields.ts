import type { SalesFieldKey } from "~/types/sales"

export type SalesFieldMeta = {
  key: SalesFieldKey
  label: string
  description?: string
  category: string
  format?: "text" | "email" | "phone" | "currency" | "number" | "percent" | "date"
}

export const SALES_FIELD_META: SalesFieldMeta[] = [
  {
    key: "id",
    label: "Record ID",
    category: "Overview",
  },
  {
    key: "recordNumber",
    label: "Record Number",
    category: "Overview",
  },
  {
    key: "opportunityName",
    label: "Opportunity",
    category: "Overview",
  },
  {
    key: "dealStage",
    label: "Deal Stage",
    category: "Overview",
  },
  {
    key: "priority",
    label: "Priority",
    category: "Overview",
  },
  {
    key: "probability",
    label: "Probability",
    category: "Overview",
    format: "percent",
  },
  {
    key: "accountName",
    label: "Account Name",
    category: "Account",
  },
  {
    key: "accountOwner",
    label: "Account Owner",
    category: "Account",
  },
  {
    key: "contactName",
    label: "Contact Name",
    category: "Contact",
  },
  {
    key: "contactEmail",
    label: "Contact Email",
    category: "Contact",
    format: "email",
  },
  {
    key: "contactPhone",
    label: "Contact Phone",
    category: "Contact",
    format: "phone",
  },
  {
    key: "billingStreet",
    label: "Billing Street",
    category: "Billing Address",
  },
  {
    key: "billingCity",
    label: "Billing City",
    category: "Billing Address",
  },
  {
    key: "billingState",
    label: "Billing State",
    category: "Billing Address",
  },
  {
    key: "billingPostalCode",
    label: "Billing Postal Code",
    category: "Billing Address",
  },
  {
    key: "billingCountry",
    label: "Billing Country",
    category: "Billing Address",
  },
  {
    key: "shippingStreet",
    label: "Shipping Street",
    category: "Shipping Address",
  },
  {
    key: "shippingCity",
    label: "Shipping City",
    category: "Shipping Address",
  },
  {
    key: "shippingState",
    label: "Shipping State",
    category: "Shipping Address",
  },
  {
    key: "shippingPostalCode",
    label: "Shipping Postal Code",
    category: "Shipping Address",
  },
  {
    key: "shippingCountry",
    label: "Shipping Country",
    category: "Shipping Address",
  },
  {
    key: "productName",
    label: "Product",
    category: "Product",
  },
  {
    key: "productCategory",
    label: "Category",
    category: "Product",
  },
  {
    key: "productSku",
    label: "SKU",
    category: "Product",
  },
  {
    key: "unitsSold",
    label: "Units Sold",
    category: "Financials",
    format: "number",
  },
  {
    key: "unitPrice",
    label: "Unit Price",
    category: "Financials",
    format: "currency",
  },
  {
    key: "grossAmount",
    label: "Gross Amount",
    category: "Financials",
    format: "currency",
  },
  {
    key: "discountRate",
    label: "Discount Rate",
    category: "Financials",
    format: "percent",
  },
  {
    key: "discountAmount",
    label: "Discount Amount",
    category: "Financials",
    format: "currency",
  },
  {
    key: "netAmount",
    label: "Net Amount",
    category: "Financials",
    format: "currency",
  },
  {
    key: "taxRate",
    label: "Tax Rate",
    category: "Financials",
    format: "percent",
  },
  {
    key: "taxAmount",
    label: "Tax Amount",
    category: "Financials",
    format: "currency",
  },
  {
    key: "totalAmount",
    label: "Total Amount",
    category: "Financials",
    format: "currency",
  },
  {
    key: "currency",
    label: "Currency",
    category: "Financials",
  },
  {
    key: "orderDate",
    label: "Order Date",
    category: "Dates",
    format: "date",
  },
  {
    key: "closeDate",
    label: "Close Date",
    category: "Dates",
    format: "date",
  },
  {
    key: "deliveryDate",
    label: "Delivery Date",
    category: "Dates",
    format: "date",
  },
  {
    key: "salesChannel",
    label: "Sales Channel",
    category: "Logistics",
  },
  {
    key: "paymentTerms",
    label: "Payment Terms",
    category: "Logistics",
  },
  {
    key: "paymentMethod",
    label: "Payment Method",
    category: "Logistics",
  },
]

export const SALES_FIELD_INDEX = new Map(
  SALES_FIELD_META.map((field) => [field.key, field]),
)

type DefaultSectionDefinition = {
  id: string
  title: string
  columns?: number
  spanColumns?: number
  fieldKeys: SalesFieldKey[]
}

export const DEFAULT_VIEW_SECTIONS: readonly DefaultSectionDefinition[] = [
  {
    id: "section-overview",
    title: "Overview",
    spanColumns: 2,
    columns: 2,
    fieldKeys: [
      "id",
      "recordNumber",
      "opportunityName",
      "dealStage",
      "priority",
      "probability",
    ],
  },
  {
    id: "section-account",
    title: "Account",
    spanColumns: 1,
    columns: 2,
    fieldKeys: ["accountName", "accountOwner"],
  },
  {
    id: "section-contact",
    title: "Contact",
    spanColumns: 1,
    columns: 2,
    fieldKeys: ["contactName", "contactEmail", "contactPhone"],
  },
  {
    id: "section-billing",
    title: "Billing Address",
    spanColumns: 2,
    columns: 2,
    fieldKeys: [
      "billingStreet",
      "billingCity",
      "billingState",
      "billingPostalCode",
      "billingCountry",
    ],
  },
  {
    id: "section-shipping",
    title: "Shipping Address",
    spanColumns: 2,
    columns: 2,
    fieldKeys: [
      "shippingStreet",
      "shippingCity",
      "shippingState",
      "shippingPostalCode",
      "shippingCountry",
    ],
  },
  {
    id: "section-product",
    title: "Product",
    spanColumns: 1,
    columns: 2,
    fieldKeys: ["productName", "productCategory", "productSku"],
  },
  {
    id: "section-financials",
    title: "Financials",
    spanColumns: 2,
    columns: 2,
    fieldKeys: [
      "unitsSold",
      "unitPrice",
      "grossAmount",
      "discountRate",
      "discountAmount",
      "netAmount",
      "taxRate",
      "taxAmount",
      "totalAmount",
      "currency",
    ],
  },
  {
    id: "section-dates",
    title: "Dates",
    spanColumns: 1,
    columns: 2,
    fieldKeys: ["orderDate", "closeDate", "deliveryDate"],
  },
  {
    id: "section-logistics",
    title: "Logistics",
    spanColumns: 1,
    columns: 2,
    fieldKeys: ["salesChannel", "paymentTerms", "paymentMethod"],
  },
] as const

