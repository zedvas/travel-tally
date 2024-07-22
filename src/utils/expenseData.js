import { splitExpenseBill } from "./billsplitting";
import { unixToDate } from "./utilsDates";
import { stringToUnix, generateId } from "./utils";

export function handleData({ formData, splitData }, home, data) {
  const expense = formData;
  let splits = [];
  if (splitData) {
    splits = JSON.parse(JSON.stringify(splitData));
    splits.forEach((bill) => {
      bill.amount = bill.amount * 100;
    });
  }
  let billSplit;
  let { date, endDate, description, category, amount, currency, split } =
    expense;
  let start = stringToUnix(expense.date);
  let end = stringToUnix(expense.endDate);

  // Wipes any existing id's if the expense is being edited
  if (expense.id) {
    delete expense.id;
    delete expense.sharedID;
  }

  // Creates object that replaces amount in original expense obj
  let newAmount = {
    fromValue: 0,
    toValue: 0,
    fromCurrency: "",
    toCurrency: { home },
  };

  // Fills data for amount from input
  newAmount.fromCurrency = currency;
  newAmount.toCurrency = home;
  newAmount.fromValue = Number(amount * 100);
  newAmount.toValue = newAmount.fromValue;

  // Converts currency if neccesary
  if (currency != home) {
    newAmount.toValue = Math.round(
      convertCurrency(newAmount.fromValue, currency, data)
    );

    if (splitData) {
      splits.forEach((bill) => {
        bill.converted = Math.round(
          convertCurrency(bill.amount, currency, data)
        );
      });
    }
  }

  // Tidies object up, adds unique id and unix time
  expense.amount = newAmount;
  delete expense.currency;
  expense.date = start;
  expense.endDate = end;
  if (expense.multiDay === true) {
    // If it's a multiday expense, it gets sent to be split
    let allExpenses = splitExpenseDays({ expense, splits });
    return allExpenses;
  }
  delete expense.multiDay;
  delete expense.endDate;
  expense.id = generateId("expense");
  if (splitData) {
    billSplit = splitExpenseBill(splits, expense, data);
  }

  console.log(JSON.stringify(expense));

  return { expense, billSplit };
}

export function convertCurrency(fromValue, fromCurrency, data) {
  const origin = fromValue;
  const rate = data[fromCurrency];
  const result = origin / rate;
  return result;
}

export function splitExpenseDays({ expense, splitData }) {
  let { date, endDate, description, category, amount, currency, split } =
    expense;
  let { fromValue, toValue } = amount;
  let allExpenses = [];
  let billSplit;
  delete expense.multiDay;
  const days = (endDate - date) / 1000 / 60 / 60 / 24 + 1;
  const newFrom = fromValue / days;
  const newTo = toValue / days;
  expense.sharedID = generateId("sharedID");
  if (splitData) {
    billSplit = splitExpenseBill(splitData, expense);
  }

  // splits up the expense object and puts in the right part of array
  for (let j = 0; j < days; j++) {
    const newDate = new Date(date);
    const currentDate = new Date(newDate.setDate(newDate.getDate() + j));
    let unix = Math.round(currentDate.getTime());
    const copy = {
      ...expense,
      id: generateId("expense"),
      date: unix,
      amount: {
        ...expense.amount,
        fromValue: newFrom,
        toValue: newTo,
      },
    };
    delete copy.endDate;
    allExpenses.push(copy);
  }
  return { allExpenses, billSplit };
}

export function mergeExpenseDays(expense, allExpenses) {
  let expenseArray = [];
  let indexs = [];
  let newExpense = {};

  if (expense.sharedID) {
    allExpenses.forEach((thisExpense, index) => {
      // Finds each expense with matching sharedID
      if (thisExpense.sharedID === expense.sharedID) {
        indexs.push(index);
        expenseArray.push(thisExpense); // Adds all of them to and array
      }
    });

    const total = expenseArray.length; // Counts how many in array
    const sorted = expenseArray.sort(function (a, b) {
      // Sorts by unix timestamp
      return a.date - b.date;
    });

    const startDate = unixToDateReversed(expenseArray[0].date); // Gets earliest date from beginning of sorted array
    const endDate = unixToDateReversed(
      expenseArray[expenseArray.length - 1].date
    ); // Gets latest date from last index

    const totalAmount = expenseArray[0].amount.fromValue * total; // Finds the original total of shared expense

    newExpense = {
      date: startDate, // Creates a new object with combined information
      endDate: endDate,
      split: expenseArray[0].split,
      category: expenseArray[0].category,
      description: expenseArray[0].description,
      multiDay: true,
      currency: expenseArray[0].amount.fromCurrency,
      amount: Math.round(totalAmount) / 100,
    };
  }
  return { newExpense, indexs };
}

export function getExpenseList(tripID, trips) {
  const indexOf = trips.findIndex((trip) => {
    return trip.id === tripID;
  });
  // Create variable for the correct trip
  const thisTrip = trips[indexOf];
  return thisTrip;
}

export function getThisExpense(expenseList, id) {
  const indexOf = expenseList.findIndex((expense) => {
    return expense.id === id;
  });
  // Create variable for the correct trip
  const thisExpense = expenseList[indexOf];
  let result = { thisExpense, indexOf };
  return result;
}

export function getThisSplit(splitList, id) {
  let allSplits = [];
  let allIndexs = [];

  splitList.forEach((thisSplit, index) => {
    // Finds each split with matching ID
    if (thisSplit.expenseID === id) {
      allSplits.push(thisSplit);
      allIndexs.push(index); // Adds all of them to and array
    }
  });

  const result = { allSplits, allIndexs };

  return result;
}

export function unixToDateReversed(unix) {
  if (!unix) {
    console.log("error finding unix");
    return;
  }

  const date = new Date(unix);
  var yyyy = date.getFullYear().toString();
  var mm = (date.getMonth() + 1).toString();
  var dd = date.getDate().toString();

  var mmChars = mm.split("");
  var ddChars = dd.split("");

  return (
    yyyy +
    "-" +
    (mmChars[1] ? mm : "0" + mmChars[0]) +
    "-" +
    (ddChars[1] ? dd : "0" + ddChars[0])
  );
}
