const { BadRequestError } = require("../expressError");

function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  //dataToUpdate:  object with each key-value pair representing a column in the database and its new value
  //jsToSql:  mapping object which translates js object keys to sql column names

  const keys = Object.keys(dataToUpdate);

  // Check if there is any data to update
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );


  //returns an object with newly translated column names and placeholders for parameterized values, as well as an array for these values to be passed
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
