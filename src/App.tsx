import React, { useState } from 'react';
import './App.css';
import moment from "moment";
import _ from "underscore"

import { usePath } from 'hookrouter';
import { useHistory } from "react-router-dom";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';

const Customers = [{
  id: "customer_1"
}]

const Books = [{
  id: "book_1",
  title: "Book one",
  description: "Amazing book"
}, {
  id: "book_2",
  title: "Book Two",
  description: "Best Book ever"
}, {
  id: "book_3",
  title: "Book Two",
  description: "Best Book ever"
}, {
  id: "book_4",
  title: "Book Two",
  description: "Best Book ever"
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
    date: moment().subtract(7, 'd'),
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


// Generated On the fly from the Engine
// charge type
const PER_DAY_RENTAL_CHARGE = 1

class Book {
  id: string;
  quantity: number;
  title?: string;
  description?: string;
  constructor(id: string, quantity: number, title?: string, description?: string) {
    this.id = id
    this.quantity = quantity
    this.title = title
    this.description = description
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
    this.books = booksRented.map((book: Book) => book.quantity).reduce((a: number, b: number) => a + b, 0);
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

function flatten(arr: any[][]): any[] {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

const ChargeCalculator = (RentedEvents: any): {
  charges: Charge[],
  rentEvents: RentReport[],
  payments: Payment[],
  returns: Return[],
  books: Book[]
} => {
  // go through the json and generate the rent objects
  const rentEvents: RentReport[] = RentedEvents.map((rent: RentReport) => {
    const {
      id,
      rentDate,
      customer,
      booksRented,
      returns,
      payments
    } = rent

    // initialize the books
    return new RentReport(id, rentDate, customer, returns, booksRented, payments)
  })

  const payments: Payment[] = flatten(rentEvents.map((rent: RentReport) => {
    const {
      payments
    } = rent

    // initialize the books
    return rent.payments
  }))

  const returns: Return[] = flatten(rentEvents.map((rent: RentReport) => {
    const {
      returns
    } = rent

    // initialize the books
    return rent.returns
  }))

  // get only the list of books involved
  const books: Book[] = _.uniq(flatten(rentEvents.map((rent: RentReport) => {
    const {
      booksRented
    } = rent

    // initialize the books
    return booksRented
  })), (book: Book, key, a) => book.id)

  const charges: Charge[] = rentEvents.map((rent: RentReport) => new Charge(rent.customer, rent.days, rent.books))

  return {
    charges,
    rentEvents,
    payments,
    returns,
    books
  };
}

const Debug_Ui = () => {
  const [{ charges, payments, returns, books, rentEvents }, setCount] = useState(ChargeCalculator(RentedEvents));

  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <table className="table">
      <thead className="thead-dark">
        <tr>
          <th scope="col">Metric</th>
          <th scope="col">Number Of Records</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">RentEvents</th>
          <td>{rentEvents.length}</td>
        </tr>
        <tr>
          <th scope="row">Charges</th>
          <td> {charges.length}</td>
        </tr>
        <tr>
          <th scope="row">Payments</th>
          <td>{payments.length}</td>
        </tr>
        <tr>
          <th scope="row">Returns</th>
          <td>{returns.length}</td>
        </tr>
        <tr>
          <th scope="row">Books</th>
          <td>{books.length}</td>
        </tr>
      </tbody>
    </table>
  );
}

const ChargesUI = () => {
  const [{ charges, rentEvents }, setCount] = useState(ChargeCalculator(RentedEvents));
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col">Currently Rented</th>
            <th scope="col">Total Rented</th>
            <th scope="col">Days Billed For</th>
            <th scope="col">ToTal Bill</th>
          </tr>
        </thead>
        <tbody>
          {
            charges.map(({ customer, books, days, cost }) => {
              return <tr>
                <th scope="row">{customer.id}</th>
                <td>{books}</td>
                <td>-</td>
                <td>{days}</td>
                <td>$ {cost}</td>
              </tr>
            })
          }
        </tbody>
      </table>
    </div>
  );
}

const BookCardUi = (props: any) => {
  const { book } = props;
  let [pic] = useState(`https://picsum.photos/200?random=${Math.floor(Math.random() * 6) + 1}`)
  let [count, setCount] = useState(1)

  return <div className="card" style={{ width: "18rem", margin: 10 }}>
    <img className="card-img-top" src={pic} alt="Card image cap" />
    <div className="card-body">
      <h5 className="card-title">{book.title}</h5>
      <p className="card-text">
        {book.description}
      </p>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <button className="btn btn-outline-secondary" onClick={() => setCount(count - 1 == 0 ? 1 : count - 1)}>
            -
          </button>
        </div>
        <input
          type="text"
          value={count}
          readOnly={true}
          className="form-control"
          aria-describedby="basic-addon1"
        />
        <div className="input-group-append">
          <button className="btn btn-outline-secondary" onClick={() => setCount(count + 1)}>
            +
          </button>
        </div>
      </div>


      <a href="#" className="btn btn-sm btn-primary">
        Add {count} book{count > 1 ? 's' : ''} to my liblary
      </a>
    </div>
  </div>
}

const EcommerceUi = () => {
  const [books, setBooks] = useState(Books)
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <div className="container-fluid" style={{ marginTop: 50 }}>
      <div className="row">
        {
          books
            .map((book: any) => new Book(book.id, book.quantity, book.title, book.description))
            .map((book: Book) => <div className="col-lg"><BookCardUi book={book} /></div>)
        }
      </div>
    </div>
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

const Navbar = (props: any) => {
  const path = usePath();
  const history = useHistory();

  let activePath: string = path

  const links: { [link: string]: string } = {
    Ecommerce: "/",
    Charges: "/charges",
    POS: "/pos",
    Monitoring: "/debug"
  }

  const [activePathResult, setActivePath] = useState(activePath);

  const boldIfCheckIfPath = (currentRoute: string): string => path === activePathResult ? "active" : ''

  history.listen((location: any, action: any) => {
    setActivePath(location.pathname)
  });

  return (<nav className="navbar navbar-expand-lg navbar-light bg-light">
    <a className="navbar-brand" href="#">
      Cool Rental Shop Name
    </a>
    <button
      className="navbar-toggler"
      type="button"
      data-toggle="collapse"
      data-target="#navbarNav"
      aria-controls="navbarNav"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span className="navbar-toggler-icon" />
    </button>
    <div className="collapse navbar-collapse" id="navbarNav">
      <ul className="navbar-nav">
        {
          Object.keys(links).map(link => {
            return <li className={`nav-item ${links[link] === activePathResult ? "active" : ''}`}>
              <Link to={links[link]} className="nav-link" href="#">
                {link} <span className="sr-only">(current)</span>
              </Link>
            </li>
          })
        }
      </ul>
    </div>
  </nav>
  )
}

const App = () => {
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/debug">
            <Navbar />
            <Debug_Ui />
          </Route>
          <Route path="/charges">
            <Navbar />
            <ChargesUI />
          </Route>
          <Route path="/pos">
            <Navbar />
            <POS_Ui />
          </Route>
          <Route path="/">
            <Navbar />
            <EcommerceUi />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
