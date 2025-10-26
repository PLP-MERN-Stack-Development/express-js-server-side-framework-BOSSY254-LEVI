const express = require('express');
const router = express.Router();
const Student = require('../models/student');

// get all students (fetch)
router.get('/', async (req, res) => {
    try {
        const students = await Student.find();  // fetch all students from DB
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// create a new student (create)
router.post('/', async (req, res) => {
    const { name, age, email } = req.body;

    try {
        const Student = new Student({ name, age, email });
        const saved = await student.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// get a student by ID (fetch)
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// update a student by ID (update)
router.put('/:id', async (req, res) => {
    const { name, age, email } = req.body;
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { name, age, email },
            { new: true, runValidators: true }
        );
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }   
});
// delete a student by ID (delete)
router.delete('/:id', async (req, res) => {
    try {   
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }   
});

module.exports = router;