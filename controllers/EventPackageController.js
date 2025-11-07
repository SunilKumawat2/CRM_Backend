const EventPackage = require("../models/EventPackage");


const createEventPackage = async (req, res) => {
    try {
        const { name, description, pricePerPerson, itemsIncluded } = req.body;


        if (!name || !pricePerPerson)
            return res.status(400).json({ status: 400, message: "Name & pricePerPerson required" });


        const pkg = await EventPackage.create({
            name,
            description,
            pricePerPerson,
            itemsIncluded,
            createdBy: req.adminId
        });


        res.status(201).json({ status: 201, message: "Package created", data: pkg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, message: "Server error" });
    }
};


const getPackages = async (req, res) => {
    try {
        const data = await EventPackage.find().sort({ createdAt: -1 });
        res.status(200).json({ status: 200, message: "Packages fetched", data });
    } catch (err) {
        res.status(500).json({ status: 500, message: "Server error" });
    }
};


const updatePackage = async (req, res) => {
    try {
        const pkg = await EventPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!pkg) return res.status(404).json({ status: 404, message: "Package not found" });
        res.status(200).json({ status: 200, message: "Package updated", data: pkg });
    } catch (err) {
        res.status(500).json({ status: 500, message: "Server error" });
    }
};


const deletePackage = async (req, res) => {
    try {
        const pkg = await EventPackage.findByIdAndDelete(req.params.id);
        if (!pkg) return res.status(404).json({ status: 404, message: "Package not found" });
        res.status(200).json({ status: 200, message: "Package deleted" });
    } catch (err) {
        res.status(500).json({ status: 500, message: "Server error" });
    }
};

module.exports = {
    createEventPackage,
    getPackages,
    updatePackage,
    deletePackage
}