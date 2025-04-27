const { v4: uuidv4 } = require("uuid");
const store = require("../store");

exports.createAssistance = (req, res) => {
  const { name } = req.body;
  const id = uuidv4();
  const newAssistance = {
    id,
    name: name || `Assistance ${id}`,
    files: [],
    threads: {}
  };
  store.assistances.push(newAssistance);
  res.status(201).json(newAssistance);
};

exports.listAssistances = (req, res) => {
  res.json(store.assistances);
};
