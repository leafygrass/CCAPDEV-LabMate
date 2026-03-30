require("../config/loadEnv");

const mongoose = require("mongoose");
const argon2 = require("argon2");

const { DATABASE_URI } = require("../config/pageConfigs");
const User = require("./models/User");
const Laboratory = require("./models/Laboratory");
const { seedReservations } = require("./seedReservations");
const { ensureAdminAccount } = require("./adminAccount");

// Demo student profiles
const demoStudents = [
    {
        type: 'Student',
        firstName: 'Student',
        lastName: 'Student',
        email: 'student@dlsu.edu.ph',
        department: 'Computer Science',
        biography: 'Student',
        image: "/uploads/profile-1.jpg",
        password: 'student',
    },
    {
        type: 'Student',
        firstName: 'Angelo',
        lastName: 'Rocha',
        email: 'angelo_rocha@dlsu.edu.ph',
        password: '345',
        biography: 'idk what to put here',
        image: "/uploads/profile-2.jpg",
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Grass',
        lastName: 'Capote',
        email: 'mary_grace_capote@dlsu.edu.ph',
        password: '456',
        biography: 'send help',
        image: "/uploads/profile-3.jpg",
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Anja',
        lastName: 'Gonzales',
        email: 'anja_gonzales@dlsu.edu.ph',
        password: '234',
        biography: 'i need sleep',
        image: "/uploads/profile-4.jpg",
        department: 'Computer Science'
    },
    {
        type: 'Student',
        firstName: 'Liana',
        lastName: 'Ho',
        email: 'denise_liana_ho@dlsu.edu.ph',
        password: '123',
        biography: 'idk stream tsunami sea yeah',
        image: "/uploads/profile-5.jpg",
        department: 'Computer Science'
    }
];

// Demo lab tech profiles
const demoLabTechs = [
    {
        type: 'LabTech',
        firstName: 'Charlie',
        lastName: 'Caronongan',
        email: 'labtech@dlsu.edu.ph',
        password: 'labtech',
        department: 'Computer Science',
        biography: 'Lab tech for DLSU. No, I am not a dog...',
        image: "/uploads/charlie.jpg",
        department: 'Computer Science',
    },
    {
        type: 'LabTech',
        firstName: 'Noah',
        lastName: 'Davis',
        email: 'noah_davis@dlsu.edu.ph',
        department: 'Computer Science',
        biography: "I am a lab tech.",
        image: "/uploads/noah.jpg",
        password: 'password123',
    },
    {
        type: 'LabTech',
        firstName: 'Michael',
        lastName: 'Myers',
        email: 'michael_myers@dlsu.edu.ph',
        biography: "*intense breathing in and out from mask sounds*",
        image: "/uploads/michael.jpg",
        password: 'password123',
    }
];

// Demo laboratories
const demoLaboratories = [
    {
        hall: 'Gokongwei Hall',
        room: 'GK404B',
        capacity: 20
    },
    {
        hall: 'Br. Andrew Gonzales Hall',
        room: 'AG1904',
        capacity: 40
    },
    {
        hall: 'Gokongwei Hall',
        room: 'GK201A',
        capacity: 20
    },
    {
        hall: 'Br. Andrew Gonzales Hall',
        room: 'AG1706',
        capacity: 40
    },
    {
        hall: 'Gokongwei Hall',
        room: 'GK302A',
        capacity: 20
    }
];

async function hashSeedUsers(users) {
    return Promise.all(
        users.map(async (user) => ({
            ...user,
            password: await argon2.hash(user.password)
        }))
    );
}

const seedDatabase = async () => {
    const shouldManageConnection = mongoose.connection.readyState === 0;

    try {
        if (shouldManageConnection) {
            await mongoose.connect(process.env.DATABASE_URL || DATABASE_URI);
            console.log("Connected to MongoDB");
        }

        // Clear existing data
        await User.deleteMany({});
        await Laboratory.deleteMany({});
        
        console.log('Previous data cleared');

        // Hash all passwords
        const hashedStudents = await hashSeedUsers(demoStudents);
        const hashedLabTechs = await hashSeedUsers(demoLabTechs);

        // Insert new demo data
        await User.insertMany(hashedStudents);
        console.log('Demo students added');

        await User.insertMany(hashedLabTechs);
        console.log('Demo lab techs added');

        await Laboratory.insertMany(demoLaboratories);
        console.log('Demo laboratories added');

        // seed reservations once users and labs are added
        await seedReservations();
        console.log('Demo reservations added');

        await ensureAdminAccount();
        console.log("Default admin account ensured");

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    } finally {
        if (shouldManageConnection) {
            await mongoose.disconnect();
        }
    }
};

if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
