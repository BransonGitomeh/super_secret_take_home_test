import React, { EffectCallback, useState, useEffect } from 'react';
import './App.css';
import moment from "moment";
import _ from "underscore"

import { usePath } from 'hookrouter';
import { useHistory } from "react-router-dom";

import axios from 'axios';

import { ReactComponent as Spinner } from './spinner.svg';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';

const Customers: Customer[] = []

const Books: Book[] = []

const RentedEvents: RentReport[] = []

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

const Debug_Ui = (props: { data: [Book[], Customer[], RentReport[]] }) => {
  const { data: [Books, Customers, RentReports] } = props
  const [{ charges, payments, returns, books, rentEvents }, setCount] = useState(ChargeCalculator(RentReports));

  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <div className="row">
      <div className="col-3">
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
      </div>
    </div>
  );
}

const ChargesUI = (props: { charges: Charge[] }) => {
  const [charges] = useState(props.charges)
  // const [{ charges, rentEvents }, setCount] = useState(ChargeCalculator(RentedEvents));
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <div className="row">
      <div className="col-8">
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
    </div>
  );
}

function useAsyncEffect(effect: (isCanceled: () => boolean) => Promise<void>, dependencies?: any[]) {
  return useEffect(() => {
    let canceled = false;
    effect(() => canceled);
    return () => { canceled = true; }
  }, dependencies)
}

const BookCardUi = (props: any) => {
  const { book } = props;
  let [pic] = useState(`https://picsum.photos/200?random=${Math.floor(Math.random() * 6) + 1}`)
  let [count, setCount] = useState(1)
  let [addedBook, setAddedBook] = useState(false)

  return <div className="card" style={{ width: "18rem", margin: 10 }}>
    <img className="card-img-top" src={pic} alt="Card image cap" />
    <div className="card-body">
      <h5 className="card-title">{book.title}</h5>
      <p className="card-text">
        {book.description}
      </p>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <button className="btn btn-outline-secondary" onClick={() => {
            setCount(count - 1 == 0 ? 1 : count - 1)

          }}>
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

      <button
        className={`btn btn-sm btn-${addedBook ? 'success' : 'primary'}`}
        onClick={() => {
          setAddedBook(true)
          setTimeout(() => {
            setCount(1)
            setAddedBook(false)
          }, 2000);
        }}
      >
        {addedBook ? "Successfully added to your books" : `Add ${count} of this books to my liblary`}
      </button>
    </div>
  </div>
}

const EcommerceUi = (props: { books: Book[] }) => {
  const [books, setBooks] = useState(props.books)
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

const Cart = (props: { selectedBooks: Book[] }) => {
  const [books, setBooks] = useState(props.selectedBooks)
  return (
    <div className="row">
      <div className="col-4">
        <div className="container-fluid">
          {books.map(book => <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between align-items-center">{book.title}
              <button
                className="badge badge-danger"
                onClick={() => {
                  setBooks(books.filter(x => x.id !== book.id))
                }}
              >
                remove
                </button>
            </li>
          </ul>)}

          <button
            style={{ margin: 10 }}
            className={`btn btn-sm btn-primary`}
          >
            Confirm Addition of this 10 books
      </button>
        </div>
      </div>
    </div>
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

      <ul className="nav justify-content-end">
        <li className="nav-item">
          <Link to="/cart" className="nav-link" href="#">
            Cart(0)
    </Link>
        </li>
      </ul>
    </div>
  </nav>
  )
}

export async function http(
  request: RequestInfo
): Promise<any> {
  const response = await fetch(request);
  const body = await response.json();
  return body;
}

const App = () => {
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  let [loadedData, setLoadedData] = useState(false)
  let [books, setBooks] = useState([] as Book[])
  let [customers, setCustomers] = useState([] as Customer[])
  let [rentevents, setRentEvents] = useState([] as RentReport[])
  let [selectedBooks, setSelectedBooks] = useState([] as Book[])
  let [charges, setCharges] = useState([] as Charge[])

  const fetchAppData = async (id: string): Promise<[
    Book[],
    Customer[],
    RentReport[]
  ]> => Promise.all([
    http(
      "http://localhost:9000/api/books"
    ),
    http(
      "http://localhost:9000/api/customers"
    ),
    http(
      "http://localhost:9000/api/rentevents"
    )
  ])

  const effectId = Math.random().toString().split(".")[1]

  useEffect(() => {
    // Create an scoped async function in the hook
    async function AsycnOp() {
      const [
        books,
        customers,
        rentevents
      ] = await fetchAppData(effectId);
      console.log(books,
        customers,
        rentevents)

      // TODO: Still OK to do some effect, useEffect hasn't been canceled yet.
      setBooks(books);
      setCustomers(customers);
      setRentEvents(rentevents);
      const { charges } = ChargeCalculator(rentevents)
      setCharges(charges)
      setLoadedData(true)

    }
    // Execute the created function directly

    AsycnOp();
  }, []);

  return !loadedData
    // show spinner
    ? <div className="preloader">
      <Spinner />
    </div>

    // show all the routes we need
    : <Router>
      {console.log(books)}
      <div>
        <Switch>
          <Route path="/debug">
            <Navbar />
            <Debug_Ui data={[books, customers, rentevents]} />
          </Route>
          <Route path="/charges">
            <Navbar />
            <ChargesUI charges={charges} />
          </Route>
          <Route path="/pos">
            <Navbar />
            <POS_Ui />
          </Route>
          <Route path="/cart">
            <Navbar />
            <Cart selectedBooks={selectedBooks} />
          </Route>
          <Route path="/">
            <Navbar />
            <EcommerceUi books={books} />
          </Route>
        </Switch>
      </div>
    </Router>

}

export default App;
