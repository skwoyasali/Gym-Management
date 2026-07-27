const Member = require("../models/Member");

// GET ALL

exports.getMembers = async (req, res) => {
  const members = await Member.find();

  res.json(members);
};

// ADD

exports.addMember = async (req, res) => {
  const member = await Member.create(req.body);

  res.json(member);
};

// DELETE

exports.deleteMember = async (req, res) => {
  await Member.findByIdAndDelete(req.params.id);

  res.json({
    message: "Deleted",
  });
};
