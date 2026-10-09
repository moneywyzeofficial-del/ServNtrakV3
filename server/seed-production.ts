import { db } from "./db";
import { clients, purchaseCategories, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const TIAGO_USER_ID = "45324416";

const seedClients = [
  {
    userId: TIAGO_USER_ID,
    name: "Andreas K",
    address: "Rua das Areias",
    hasGarden: true,
    hasPool: true,
    hasJacuzzi: false,
    poolLength: 10,
    poolWidth: 4,
    poolMinDepth: 1.0,
    poolMaxDepth: 1.8,
    poolVisitFrequency: "seasonal",
    billingType: "monthly" as const,
    monthlyRate: 590,
    latitude: 39.2495711624115,
    longitude: -9.3359112739563,
  },
  {
    userId: TIAGO_USER_ID,
    name: "Paul (C. Labrusque)",
    hasGarden: true,
    hasPool: true,
    hasJacuzzi: false,
    poolLength: 7.5,
    poolWidth: 3.5,
    poolMinDepth: 1.0,
    poolMaxDepth: 1.6,
    poolVisitFrequency: "once_monthly",
    billingType: "monthly" as const,
    monthlyRate: 160,
    latitude: 39.250371539056914,
    longitude: -9.33666229248047,
  },
  {
    userId: TIAGO_USER_ID,
    name: "Cristian (C. Labrusque)",
    hasGarden: true,
    hasPool: true,
    hasJacuzzi: false,
    billingType: "monthly" as const,
    monthlyRate: 170,
    poolLength: 8,
    poolWidth: 3.5,
    poolMinDepth: 1.0,
    poolMaxDepth: 1.7,
    latitude: 39.250367455203026,
    longitude: -9.336254596710207,
  },
  {
    userId: TIAGO_USER_ID,
    name: "D. Edite",
    hasGarden: true,
    hasPool: false,
    hasJacuzzi: false,
    billingType: "hourly" as const,
    hourlyRate: 15,
    latitude: 39.25072227163154,
    longitude: -9.33415710926056,
  },
  {
    userId: TIAGO_USER_ID,
    name: "Irmãs Matos",
    hasGarden: true,
    hasPool: true,
    hasJacuzzi: false,
    poolLength: 6,
    poolWidth: 3,
    poolMinDepth: 1.2,
    poolMaxDepth: 1.8,
    poolVisitFrequency: "on_demand",
    billingType: "monthly" as const,
    monthlyRate: 170,
    latitude: 39.245265551909704,
    longitude: -9.315724968910219,
  },
];

const defaultCategories = [
  "Jardim",
  "Rega",
  "Piscina",
  "Jacuzzi",
  "Fitofarmacêuticos",
  "Combustíveis",
  "Máquinas",
];

export async function seedProductionData() {
  console.log("Starting production data seed...");

  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, TIAGO_USER_ID));

  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: TIAGO_USER_ID,
      username: "tiago",
      email: "tiago@servntrak.pt",
      firstName: "Tiago",
      lastName: "Santos",
      provider: "local",
    });
    console.log("  - Added default user Tiago");
  }

  // Check if clients already exist for this user
  const existingClients = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, TIAGO_USER_ID));

  if (existingClients.length === 0) {
    console.log("Seeding clients...");
    for (const client of seedClients) {
      await db.insert(clients).values(client);
      console.log(`  - Added client: ${client.name}`);
    }
  } else {
    console.log(`Clients already exist (${existingClients.length} found), skipping...`);
  }

  // Check if categories already exist for this user
  const existingCategories = await db
    .select()
    .from(purchaseCategories)
    .where(eq(purchaseCategories.userId, TIAGO_USER_ID));

  if (existingCategories.length === 0) {
    console.log("Seeding purchase categories...");
    for (const categoryName of defaultCategories) {
      await db.insert(purchaseCategories).values({
        userId: TIAGO_USER_ID,
        name: categoryName,
        isDefault: true,
      });
      console.log(`  - Added category: ${categoryName}`);
    }
  } else {
    console.log(`Categories already exist (${existingCategories.length} found), skipping...`);
  }

  console.log("Production data seed complete!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProductionData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
