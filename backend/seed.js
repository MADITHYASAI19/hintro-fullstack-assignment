const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const users = [
    { username: 'Admin', email: 'admin@gmail.com', password: 'password' },
    { username: 'User 1', email: 'user1@gmail.com', password: 'password' },
    { username: 'User 2', email: 'user2@gmail.com', password: 'password' },
    { username: 'User 3', email: 'user3@gmail.com', password: 'password' }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Check if users already exist to avoid duplicates or error
        for (const user of users) {
            const exists = await User.findOne({ email: user.email });
            if (!exists) {
                const newUser = new User(user);
                await newUser.save();
                console.log(`Created user: ${user.username}`);
            } else {
                console.log(`User already exists: ${user.username}`);
            }
        }

        console.log('Database seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
