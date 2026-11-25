const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const SavedProperty = require('../models/SavedProperty');
const Enquiry = require('../models/Enquiry');

const DEMO_PASSWORD = 'Password123!';

const futureDate = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(11, 0, 0, 0);
  return date;
};

async function seedDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run seed script in production environment');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured in server/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('[SEED] Connected to MongoDB');

  try {
    await Promise.all([
      SavedProperty.deleteMany({}),
      Enquiry.deleteMany({}),
      Property.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('[SEED] Cleared existing collections');

    const users = await User.create([
      {
        name: 'Aarav Mehta (Admin)',
        email: 'admin@renteasy.com',
        password: DEMO_PASSWORD,
        phone: '+91-9810000001',
        role: 'admin',
      },
      {
        name: 'Rohan Kapoor',
        email: 'owner1@renteasy.com',
        password: DEMO_PASSWORD,
        phone: '+91-9811111101',
        role: 'owner',
      },
      {
        name: 'Priya Nair',
        email: 'owner2@renteasy.com',
        password: DEMO_PASSWORD,
        phone: '+91-9822222202',
        role: 'owner',
      },
      {
        name: 'Ananya Sharma',
        email: 'tenant1@renteasy.com',
        password: DEMO_PASSWORD,
        phone: '+91-9833333303',
        role: 'tenant',
      },
      {
        name: 'Vikram Singh',
        email: 'tenant2@renteasy.com',
        password: DEMO_PASSWORD,
        phone: '+91-9844444404',
        role: 'tenant',
      },
    ]);

    const [admin, owner1, owner2, tenant1, tenant2] = users;

    const propertySeeds = [
      {
        owner: owner1._id,
        title: 'Sunlit 2BHK Apartment Near Saket Metro',
        description:
          'Bright, cross-ventilated 2BHK apartment within walking distance of Saket Metro Station. Includes modular kitchen, split ACs, and covered stilt parking.',
        rent: 34000,
        deposit: 68000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1150,
        propertyType: 'apartment',
        location: {
          area: 'Saket',
          city: 'Delhi',
          address: 'D-42, Freedom Fighters Enclave, Saket',
          pincode: '110068',
        },
        amenities: ['Parking', 'AC', 'Lift', 'Power Backup', 'Security'],
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      {
        owner: owner1._id,
        title: 'Spacious 3BHK Family Floor in Dwarka Sector 10',
        description:
          'Corner 3BHK builder floor overlooking a neighborhood park in Dwarka Sector 10. Ideal for families seeking quiet surroundings and metro connectivity.',
        rent: 28000,
        deposit: 56000,
        bedrooms: 3,
        bathrooms: 2,
        areaSqFt: 1450,
        propertyType: 'independent_house',
        location: {
          area: 'Dwarka',
          city: 'Delhi',
          address: 'Plot 18, Sector 10, Dwarka',
          pincode: '110075',
        },
        amenities: ['Parking', 'Power Backup', 'Security', 'WiFi'],
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      {
        owner: owner1._id,
        title: 'Designer 3BHK Terrace Residence in Hauz Khas',
        description:
          'Architectural 3BHK residence steps away from Deer Park in Hauz Khas. Features hardwood flooring, private terrace deck, and full power backup.',
        rent: 68000,
        deposit: 136000,
        bedrooms: 3,
        bathrooms: 3,
        areaSqFt: 1950,
        propertyType: 'apartment',
        location: {
          area: 'Hauz Khas',
          city: 'Delhi',
          address: 'C-19, Hauz Khas Enclave',
          pincode: '110016',
        },
        amenities: ['Parking', 'AC', 'Furnished', 'Power Backup', 'Security'],
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      {
        owner: owner1._id,
        title: '4BHK Gated Villa in Vasant Kunj',
        description:
          'Expansive 4BHK villa inside a gated enclave in Vasant Kunj with private lawn, servant quarter, and two covered parking bays.',
        rent: 85000,
        deposit: 170000,
        bedrooms: 4,
        bathrooms: 4,
        areaSqFt: 2800,
        propertyType: 'villa',
        location: {
          area: 'Vasant Kunj',
          city: 'Delhi',
          address: 'Sector B, Pocket 7, Vasant Kunj',
          pincode: '110070',
        },
        amenities: ['Parking', 'AC', 'Security', 'Power Backup', 'Gym'],
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      {
        owner: owner2._id,
        title: 'Furnished Studio Loft in Indiranagar 100ft Road',
        description:
          'Minimalist furnished studio loft off 100ft Road, Indiranagar. Equipped with high-speed fiber WiFi, workspace desk, and washer-dryer.',
        rent: 26000,
        deposit: 75000,
        bedrooms: 1,
        bathrooms: 1,
        areaSqFt: 560,
        propertyType: 'studio',
        location: {
          area: 'Indiranagar',
          city: 'Bengaluru',
          address: '12th Main, HAL 2nd Stage, Indiranagar',
          pincode: '560038',
        },
        amenities: ['WiFi', 'AC', 'Furnished', 'Lift', 'Power Backup'],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      {
        owner: owner2._id,
        title: '2BHK Modern Apartment in Koramangala 4th Block',
        description:
          'Well-maintained 2BHK in Koramangala 4th Block close to cafes, tech parks, and Sony Signal. Includes gym access and 24/7 security.',
        rent: 42000,
        deposit: 120000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1220,
        propertyType: 'apartment',
        location: {
          area: 'Koramangala',
          city: 'Bengaluru',
          address: '80 Feet Road, 4th Block, Koramangala',
          pincode: '560034',
        },
        amenities: ['Parking', 'Gym', 'Lift', 'Security', 'Power Backup'],
        images: [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      {
        owner: owner2._id,
        title: 'Private Room PG Suite in Koramangala 6th Block',
        description:
          'Clean private-occupancy PG suite with housekeeping, high-speed WiFi, and home-style meals optional. Quiet residential street.',
        rent: 14000,
        deposit: 20000,
        bedrooms: 1,
        bathrooms: 1,
        areaSqFt: 280,
        propertyType: 'pg',
        location: {
          area: 'Koramangala',
          city: 'Bengaluru',
          address: '6th Block, Koramangala',
          pincode: '560095',
        },
        amenities: ['WiFi', 'Furnished', 'Security', 'Power Backup'],
        images: [
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      {
        owner: owner2._id,
        title: 'Garden-Facing 3BHK in Indiranagar Defence Colony',
        description:
          'Quiet 3BHK apartment in Defence Colony, Indiranagar with lush tree-lined views, large balconies, and modular wardrobes.',
        rent: 62000,
        deposit: 180000,
        bedrooms: 3,
        bathrooms: 3,
        areaSqFt: 1780,
        propertyType: 'apartment',
        location: {
          area: 'Indiranagar',
          city: 'Bengaluru',
          address: '4th Cross, Defence Colony, Indiranagar',
          pincode: '560038',
        },
        amenities: ['Parking', 'AC', 'Lift', 'Security', 'Power Backup'],
        images: [
          'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      {
        owner: owner1._id,
        title: '1BHK Smart Apartment in Dwarka Sector 12',
        description:
          'Compact 1BHK flat near Dwarka Sector 12 Metro with balcony, geyser, and gated society security.',
        rent: 16500,
        deposit: 33000,
        bedrooms: 1,
        bathrooms: 1,
        areaSqFt: 620,
        propertyType: 'apartment',
        location: {
          area: 'Dwarka',
          city: 'Delhi',
          address: 'Pocket 4, Sector 12, Dwarka',
          pincode: '110078',
        },
        amenities: ['Lift', 'Security', 'Power Backup'],
        images: [
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'approved',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      // 2 Pending listings for Admin moderation demo
      {
        owner: owner1._id,
        title: 'Newly Renovated 2BHK in Saket J Block',
        description:
          'Freshly painted 2BHK apartment in Saket J Block with brand-new kitchen fittings and inverter backup.',
        rent: 36000,
        deposit: 72000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1100,
        propertyType: 'apartment',
        location: {
          area: 'Saket',
          city: 'Delhi',
          address: 'J-104, Saket',
          pincode: '110017',
        },
        amenities: ['Parking', 'AC', 'Power Backup'],
        images: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'pending',
      },
      {
        owner: owner2._id,
        title: 'Penthouse Studio with Deck in Indiranagar',
        description:
          'Top-floor studio apartment with private open deck, skylight, and elevator access in Indiranagar.',
        rent: 31000,
        deposit: 90000,
        bedrooms: 1,
        bathrooms: 1,
        areaSqFt: 650,
        propertyType: 'studio',
        location: {
          area: 'Indiranagar',
          city: 'Bengaluru',
          address: '10th Main, Indiranagar',
          pincode: '560038',
        },
        amenities: ['WiFi', 'Lift', 'Furnished', 'AC'],
        images: [
          'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'pending',
      },
      // 1 Rejected listing for Owner edit-and-resubmit demo
      {
        owner: owner1._id,
        title: '2BHK Budget Flat in Vasant Kunj',
        description:
          'Affordable 2BHK ground floor unit in Vasant Kunj with easy access to main market and bus stop.',
        rent: 24000,
        deposit: 48000,
        bedrooms: 2,
        bathrooms: 1,
        areaSqFt: 850,
        propertyType: 'apartment',
        location: {
          area: 'Vasant Kunj',
          city: 'Delhi',
          address: 'Pocket 2, Vasant Kunj',
          pincode: '110070',
        },
        amenities: ['Security'],
        images: [
          'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
        ],
        isAvailable: true,
        approvalStatus: 'rejected',
        rejectionReason:
          'Please upload at least two interior photos and clarify parking availability.',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
    ];

    const properties = await Property.create(propertySeeds);
    const approvedProps = properties.filter((p) => p.approvalStatus === 'approved');

    await SavedProperty.create([
      { tenant: tenant1._id, property: approvedProps[0]._id },
      { tenant: tenant1._id, property: approvedProps[4]._id },
      { tenant: tenant2._id, property: approvedProps[2]._id },
    ]);

    await Enquiry.create([
      {
        property: approvedProps[0]._id,
        tenant: tenant1._id,
        owner: approvedProps[0].owner,
        type: 'visit_request',
        message: 'Hi, I would love to schedule a visit this weekend around 11 AM.',
        preferredVisitDate: futureDate(3),
        status: 'pending',
      },
      {
        property: approvedProps[4]._id,
        tenant: tenant1._id,
        owner: approvedProps[4].owner,
        type: 'enquiry',
        message: 'Is the studio available for a 12-month lease starting next month?',
        status: 'accepted',
        ownerResponse: 'Yes, it is available from the 1st. Happy to arrange a call.',
        respondedAt: new Date(),
      },
      {
        property: approvedProps[1]._id,
        tenant: tenant2._id,
        owner: approvedProps[1].owner,
        type: 'visit_request',
        message: 'Looking to move in with family. Can we inspect the property on Friday?',
        preferredVisitDate: futureDate(5),
        status: 'declined',
        ownerResponse: 'Friday afternoon is booked; please request a Saturday slot.',
        respondedAt: new Date(),
      },
      {
        property: approvedProps[5]._id,
        tenant: tenant2._id,
        owner: approvedProps[5].owner,
        type: 'enquiry',
        message: 'Does the rent include monthly society maintenance charges?',
        status: 'pending',
      },
    ]);

    await Promise.all([
      User.syncIndexes(),
      Property.syncIndexes(),
      SavedProperty.syncIndexes(),
      Enquiry.syncIndexes(),
    ]);

    console.log('\n[SEED] Seeded RentEasy database successfully:');
    console.log(`  Users:           ${users.length}`);
    console.log(`  Properties:      ${properties.length} (9 approved, 2 pending, 1 rejected)`);
    console.log('  SavedProperties: 3');
    console.log('  Enquiries:       4');
    console.log('\nDemo Credentials (Password for all: Password123!):');
    console.table([
      { Role: 'admin', Email: 'admin@renteasy.com', Password: DEMO_PASSWORD },
      { Role: 'owner', Email: 'owner1@renteasy.com', Password: DEMO_PASSWORD },
      { Role: 'owner', Email: 'owner2@renteasy.com', Password: DEMO_PASSWORD },
      { Role: 'tenant', Email: 'tenant1@renteasy.com', Password: DEMO_PASSWORD },
      { Role: 'tenant', Email: 'tenant2@renteasy.com', Password: DEMO_PASSWORD },
    ]);
  } finally {
    await mongoose.connection.close();
    console.log('[SEED] MongoDB connection closed');
  }
}

seedDatabase().catch((err) => {
  console.error('[SEED] Failed:', err.message);
  process.exit(1);
});
