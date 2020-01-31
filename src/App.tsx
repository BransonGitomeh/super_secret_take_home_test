import React from 'react';
import logo from './logo.svg';
import './App.css';
import moment from "moment";
import _ from "underscore"

const Customers = [{
  id: "customer_1"
}]

const Books = [{
  id: "book_1"
}]

const RentedEvents = [{
  id: "rent_5_days_ago_for_2 days",
  rentDate: moment().subtract(5, 'd'),
  customer: {
    id: "customer_1"
  },
  quantity: 7,
  booksRented: [{
    id: "book_1",
    quantity: 3
  }, {
    id: "book_2",
    quantity: 4
  }],
  payments: [{
    id: "payment_1",
    amount: 3
  }],
  returns: [{
    date: moment().subtract(2, 'd'),
    books: [{
      id: "book_1",
      quantity: 2
    }, {
      id: "book_2",
      quantity: 1
    }]
  }]
}]

const Debug_Ui = () => {
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <h1> Debug UI</h1>
  );
}

// Generated On the fly from the Engine
// charge type
const PER_DAY_RENTAL_CHARGE = 1

class Book {
  id: string;
  quantity: number;
  constructor(id: string, quantity: number) {
    this.id = id
    this.quantity = quantity
  }
}

class Return {
  id: string;
  date: Date;
  books: Book[]
  constructor(customer: string, date: Date, books: Book[]) {
    this.id = customer
    this.books = books
    this.date = date
  }
}

class Payment {
  id: string;
  date: Date;
  amount: number;
  constructor(customer: string, date: Date, amount: number) {
    this.id = customer
    this.date = date
    this.amount = amount
  }
}

class RentReport {
  id: string;
  customerId: string;
  customer: Customer
  rentDate: Date;
  booksRented: Book[];
  booksQuantity: number;
  returns: Return[];
  payments: Payment[];
  books: number;
  days: number;
  constructor(id: string, rentDate: Date, customer: Customer, returns: Return[], booksRented: Book[], payments: Payment[]) {
    this.id = id
    this.rentDate = rentDate
    this.booksRented = booksRented
    this.booksQuantity = booksRented.length
    this.customer = customer
    this.customerId = customer.id
    this.returns = returns
    this.payments = payments

    // get number of days we are billing for from the last payment
    const latestReturnDate: Return = _.max(returns, (r) => new Date(r.date).getTime())
    const latestPaymentDate: Payment = _.max(payments, (r) => new Date(r.date).getTime())

    // subtract that from last payment to get number of days to bill for
    const days: number = moment.duration(
      moment(latestReturnDate.date).diff(moment(latestPaymentDate.date))
    ).asDays()

    this.days = days;

    // Get number of books we are billing for
    // get unique books and remove the retuned once from this customers logs
    this.books = booksRented.map((book:Book) => book.quantity).reduce((a: number, b: number) => a + b, 0);
  }
}

class Customer {
  id: string;
  constructor(customer: string) {
    this.id = customer
  }
}

class Charge {
  customer: Customer;
  PER_DAY_RENTAL_CHARGE: number;
  cost: number;
  days: number;
  books: number;
  constructor(customer: Customer, days: number, books: number) {
    this.PER_DAY_RENTAL_CHARGE = 1
    this.customer = customer
    this.books = books
    this.days = days
    this.cost = books * (days * PER_DAY_RENTAL_CHARGE)
  }
}

const ChargeCalculator = (RentedEvents: any): Charge[] => {
  // go through the json and generate the rent objects
  const rents: RentReport[] = RentedEvents.map((rent: RentReport) => {
    const {
      id,
      rentDate,
      customerId,
      booksRented,
      returns,
      payments
    } = rent

    // init the customer
    let customer: Customer = new Customer(customerId)

    // initialize the books
    return new RentReport(id, rentDate, customer, returns, booksRented, payments)
  })

  const Charges: Charge[] = rents.map((rent: RentReport) => new Charge(rent.customer, rent.days, rent.books))

  return Charges;
}

const ChargesUI = () => {
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <div>
      <table>
        <thead>
          <th>customer</th>
          <th>books</th>
          <th>days</th>
          <th>cost</th>
        </thead>
        <tbody>
          {
            ChargeCalculator(RentedEvents).map(({ customer: { id }, books, days, cost }) => {
              return <tr>
                <td>{id}</td>
                <td>{books}</td>
                <td>{days}</td>
                <td>{cost}</td>
              </tr>
            })
          }
        </tbody>
      </table>
    </div>
  );
}

const EcommerceUi = () => {
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <h1> Ecommerce UI</h1>
  );
}

const POS_Ui = () => {
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <h1> POS UI</h1>
  );
}

const Receipt = () => {
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <h1> Receipt UI</h1>
  );
}

const App = () => {
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <div className="App">
      <Debug_Ui />
      <ChargesUI />
      <POS_Ui />
      <EcommerceUi />
    </div>
  );
}

export default App;
