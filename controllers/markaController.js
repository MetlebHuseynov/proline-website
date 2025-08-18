const Marka = require('../models/Marka');

// @desc    Get all markas
// @route   GET /api/markas
// @access  Public
exports.getMarkas = async (req, res) => {
  try {
    const markas = await Marka.find();

    res.status(200).json({
      success: true,
      count: markas.length,
      data: markas
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single marka
// @route   GET /api/markas/:id
// @access  Public
exports.getMarka = async (req, res) => {
  try {
    const marka = await Marka.findById(req.params.id);

    if (!marka) {
      return res.status(404).json({ success: false, error: 'Marka not found' });
    }

    res.status(200).json({
      success: true,
      data: marka
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create new marka
// @route   POST /api/markas
// @access  Private (Admin)
exports.createMarka = async (req, res) => {
  try {
    const marka = await Marka.create(req.body);

    res.status(201).json({
      success: true,
      data: marka
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update marka
// @route   PUT /api/markas/:id
// @access  Private (Admin)
exports.updateMarka = async (req, res) => {
  try {
    let marka = await Marka.findById(req.params.id);

    if (!marka) {
      return res.status(404).json({ success: false, error: 'Marka not found' });
    }

    marka = await Marka.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: marka
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete marka
// @route   DELETE /api/markas/:id
// @access  Private (Admin)
exports.deleteMarka = async (req, res) => {
  try {
    const marka = await Marka.findById(req.params.id);

    if (!marka) {
      return res.status(404).json({ success: false, error: 'Marka not found' });
    }

    await marka.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};