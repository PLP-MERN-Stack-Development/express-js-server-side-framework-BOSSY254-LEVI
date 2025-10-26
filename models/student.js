const mongoose = require('mongoose');

// Define the Student schema(rules to follow to create collection)
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
}, { timestamps: true });

// Create the Student model (representation of the collection)
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;