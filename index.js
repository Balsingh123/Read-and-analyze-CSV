const fs = require('fs');
const csv = require('csv-parser');

// Function to analyze the CSV file and return results
function analyzeEmployeeData(filePath) {
  const consecutiveDaysThreshold = 7;
  const minTimeBetweenShifts = 1; // in hours
  const maxTimeBetweenShifts = 10; // in hours
  const maxSingleShiftDuration = 14; // in hours

  // Storage for analyzed results
  const results = {
    consecutiveDays: [],
    timeBetweenShifts: [],
    singleShiftDuration: [],
  };

  // Storage for employee records
  const employeeRecords = {};

  // Read CSV file and parse data
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const employeeName = row['Employee Name'];
        const position = row['Position ID'];
        const timeIn = new Date(`${row['Time']}`);
        const timeOut = new Date(`${row['Time Out']}`);

        // Initialize employee record if not present
        if (!employeeRecords[employeeName]) {
          employeeRecords[employeeName] = [];
        }

        const records = employeeRecords[employeeName];
        const lastRecord = records[records.length - 1];

        // Check for consecutive days
        if (lastRecord && isConsecutiveDays(lastRecord.timeOut, timeIn, consecutiveDaysThreshold)) {
          results.consecutiveDays.push({ employeeName, position });
        }

        // Check for time between shifts
        if (lastRecord && isTimeBetweenShifts(lastRecord.timeOut, timeIn, minTimeBetweenShifts, maxTimeBetweenShifts)) {
          results.timeBetweenShifts.push({ employeeName, position });
        }

        // Check for single shift duration
        const shiftDuration = (timeOut - timeIn) / (60 * 60 * 1000); // Difference in hours
        if (shiftDuration > maxSingleShiftDuration) {
          results.singleShiftDuration.push({ employeeName, position });
        }

        // Add the record to the employee records
        records.push({ timeIn, timeOut });
      })
      .on('end', () => {
        // Resolve with the results
        resolve(results);
      })
      .on('error', (error) => {
        // Reject with the error
        reject(error);
      });
  });
}

// Function to check if two timestamps are within a given consecutive days threshold
function isConsecutiveDays(timeOut, timeIn, threshold) {
  const diffInDays = Math.abs((timeIn - timeOut) / (24 * 60 * 60 * 1000));
  return diffInDays <= threshold;
}

// Function to check if the time between two shifts is within a given range
function isTimeBetweenShifts(timeOut, timeIn, minHours, maxHours) {
  const timeDiff = (timeIn - timeOut) / (60 * 60 * 1000); // Difference in hours
  return timeDiff > minHours && timeDiff < maxHours;
}

// Example usage:
const filePath = 'Assignment_Timecard.xlsx - Sheet1.csv';
analyzeEmployeeData(filePath)
  .then((results) => {
    // Output the results to the console or use them as needed
    console.log('\nEmployees who have worked for 7 consecutive days:');
    console.log(results.consecutiveDays);

    console.log('\nEmployees with less than 10 hours between shifts but greater than 1 hour:');
    console.log(results.timeBetweenShifts);

    console.log('\nEmployees who have worked for more than 14 hours in a single shift:');
    console.log(results.singleShiftDuration);
  })
  .catch((error) => {
    console.error('An error occurred:', error);
  });
