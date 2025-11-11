import { faker } from "@faker-js/faker";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RECORD_COUNT = 1000;

function createSalesRecord(index) {
  const unitsSold = faker.number.int({ min: 1, max: 50 });
  const unitPrice = Number(faker.commerce.price({ min: 10, max: 500, dec: 2 }));
  const grossAmount = Number((unitsSold * unitPrice).toFixed(2));
  const discountRate = faker.number.float({ min: 0, max: 0.3, fractionDigits: 2 });
  const discountAmount = Number((grossAmount * discountRate).toFixed(2));
  const netAmount = Number((grossAmount - discountAmount).toFixed(2));
  const taxRate = faker.number.float({ min: 0, max: 0.2, fractionDigits: 2 });
  const taxAmount = Number((netAmount * taxRate).toFixed(2));
  const totalAmount = Number((netAmount + taxAmount).toFixed(2));
  const recordCreated = faker.date.past({ years: 2 });
  const orderDate = recordCreated.toISOString();
  const closeDate = faker.date.soon({ days: 45, refDate: orderDate }).toISOString();
  const deliveryDate = faker.date.soon({ days: 20, refDate: closeDate }).toISOString();

  return {
    id: faker.string.uuid(),
    recordNumber: `RN-${String(index + 1).padStart(5, "0")}`,
    opportunityName: faker.company.catchPhrase(),
    accountName: faker.company.name(),
    accountOwner: `${faker.person.firstName()} ${faker.person.lastName()}`,
    contactName: `${faker.person.firstName()} ${faker.person.lastName()}`,
    contactEmail: faker.internet.email().toLowerCase(),
    contactPhone: faker.phone.number(),
    billingStreet: faker.location.streetAddress(),
    billingCity: faker.location.city(),
    billingState: faker.location.state(),
    billingPostalCode: faker.location.zipCode(),
    billingCountry: faker.location.country(),
    shippingStreet: faker.location.streetAddress(),
    shippingCity: faker.location.city(),
    shippingState: faker.location.state(),
    shippingPostalCode: faker.location.zipCode(),
    shippingCountry: faker.location.country(),
    productName: faker.commerce.productName(),
    productCategory: faker.commerce.department(),
    productSku: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
    unitsSold,
    unitPrice,
    grossAmount,
    discountRate,
    discountAmount,
    netAmount,
    taxRate,
    taxAmount,
    totalAmount,
    currency: faker.finance.currencyCode(),
    orderDate,
    closeDate,
    deliveryDate,
    dealStage: faker.helpers.arrayElement([
      "Prospecting",
      "Qualification",
      "Proposal",
      "Negotiation",
      "Closed Won",
      "Closed Lost",
    ]),
    salesChannel: faker.helpers.arrayElement([
      "Direct",
      "Partner",
      "Online",
      "Retail",
      "Field",
    ]),
    paymentTerms: faker.helpers.arrayElement([
      "Due on Receipt",
      "Net 15",
      "Net 30",
      "Net 60",
      "Installments",
    ]),
    paymentMethod: faker.helpers.arrayElement([
      "Credit Card",
      "Wire Transfer",
      "ACH",
      "Check",
      "Cash",
    ]),
    probability: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
    priority: faker.helpers.arrayElement(["Low", "Medium", "High", "Urgent"]),
  };
}

async function main() {
  const records = Array.from({ length: RECORD_COUNT }, (_, index) =>
    createSalesRecord(index),
  );

  const dataDir = join(__dirname, "..", "src", "data");
  const filePath = join(dataDir, "sales.json");

  await mkdir(dataDir, { recursive: true });
  await writeFile(filePath, JSON.stringify(records, null, 2));

  console.log(`Wrote ${records.length} records to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

