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

const BookCardUi = (props: { book: Book, addToUserLiblary: (book: Book) => void }) => {
  const { book, addToUserLiblary } = props;
  let [pic] = useState(`https://picsum.photos/200?random=${Math.floor(Math.random() * 9) + 1}`)
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
          book.quantity = count
          addToUserLiblary(book)
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

const EcommerceUi = (props: { books: Book[], addToUserLiblary: (book: Book) => void }) => {
  const [books, setBooks] = useState(props.books)
  // react router with two pages 
  // - admin 
  // - booking from book lists
  // - simple cart solution to create Rentings
  // - login where password is always 1:2:3:4:5
  // later, add the ability to login as a customer by provising a hardcoded password just for demo
  return (
    <div className="container-fluid" style={{ marginTop: 20 }}>
      <div className="row">

        {
          books
            .map((book: any) => new Book(book.id, book.quantity, book.title, book.description))
            .map((book: Book) => <div className="col-lg"><BookCardUi book={book} addToUserLiblary={props.addToUserLiblary} /></div>)
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

const Cart = (props: { cart: Book[], setBooks: (books: Book[]) => void, selectedCustomer: Customer, confirmBooks: (book: Book[]) => void }) => {
  const { cart, setBooks, confirmBooks, selectedCustomer } = props

  const [saved, setSaved] = useState(false)
  let totalBooks = 0;
  for (var i = 0; i < cart.length; i++) {
    totalBooks += cart[i].quantity;
  }

  return (
    <div className="row sticky-top">
      <div className="col-12">
        <div className="container-fluid">

          {cart.map(book => <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between align-items-center">{book.quantity} Copies of "{book.title}"
              <button
                className="badge badge-danger"
                onClick={() => {
                  setBooks(props.cart.filter(x => x.id !== book.id))
                }}
              >
                remove
                </button>
            </li>
          </ul>)}

          {cart.length !== 0
            ? <button
              style={{ margin: 10 }}
              className={`btn btn-sm ${!saved ? "btn-primary" : "btn-success"}`}
              onClick={() => {
                confirmBooks(cart)
                setSaved(true)
                setTimeout(() => {
                  setSaved(false)
                  setBooks([] as Book[])
                }, 2000);
              }}
            >
              {!saved ? `Confirm Addition of this ${totalBooks} books` : "Added book as a rental"}

            </button>
            : <div style={{ margin: 30 }} className="alert alert-warning" role="alert">
              <b>{selectedCustomer.id}</b> does not have any books on this cart, please add some from <Link to="/">here</Link>
            </div>}
        </div>
      </div>
    </div>
  );
}

const SelectCustomer = (props: { customers: Customer[], selectedCustomer: Customer, selectCustomer: (customer: string) => void }) => {
  const { customers, selectCustomer, selectedCustomer } = props

  return <div className="dropdown" style={{ zIndex: 1025 }}>
    <button
      className="btn btn-secondary dropdown-toggle"
      type="button"
      id="dropdownMenuButton"
      data-toggle="dropdown"
      aria-haspopup="true"
      aria-expanded="false"
    >
      {!selectedCustomer ? `Select Customer ${customers.length}` : selectedCustomer.id}
    </button>
    <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
      {
        customers.map((customer: Customer) => <button
          className="dropdown-item"
          onClick={() => {
            selectCustomer(customer.id.toString())
          }}
        >
          {selectedCustomer.id}
        </button>)
      }
    </div >
  </div >
}

const Navbar = (props: { cart: Book[], customers: Customer[], selectedCustomer: Customer, selectCustomer: (customer: string) => void }) => {
  const { cart, customers, selectCustomer, selectedCustomer } = props
  const path = usePath();
  const history = useHistory();

  let activePath: string = path

  const links: { [link: string]: string } = {
    Ecommerce: "/",
    Charges: "/charges",
    // POS: "/pos",
    Monitoring: "/debug"
  }
  // const [cart, setCart] = useState(props.cart);
  const [activePathResult, setActivePath] = useState(activePath);

  const boldIfCheckIfPath = (currentRoute: string): string => path === activePathResult ? "active" : ''

  history.listen((location: any, action: any) => {
    setActivePath(location.pathname)
  });

  return (<nav className="navbar navbar-expand-lg navbar-expand-md navbar-light bg-light">
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

      <ul className="navbar-nav ml-auto">
        <li className="nav-item">
          <Link to="/cart" className="nav-link" href="#">
            Cart({cart.length})
    </Link>
        </li>
        <li className="nav-item">
          <SelectCustomer customers={customers} selectedCustomer={selectedCustomer} selectCustomer={selectCustomer} />
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
  let [selectedCustomer, setSelectedCustomer] = useState({ id: '' } as Customer)

  let [loadedData, setLoadedData] = useState(false)
  let [books, setBooks] = useState([] as Book[])
  let [customers, setCustomers] = useState([] as Customer[])
  let [rentevents, setRentEvents] = useState([] as RentReport[])
  let [selectedBooks, setSelectedBooks] = useState([] as Book[])
  let [charges, setCharges] = useState([] as Charge[])
  let [cart, setCart] = useState([] as Book[])

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

      // TODO: Still OK to do some effect, useEffect hasn't been canceled yet.
      setBooks(books);
      setCustomers(customers);
      setRentEvents(rentevents);
      const { charges } = ChargeCalculator(rentevents)
      setCharges(charges)
      setSelectedCustomer(customers[0])
      setLoadedData(true)
    }
    // Execute the created function directly

    AsycnOp();
  }, []);


  function addToUserLiblary(book: Book): void {
    setCart([book, ...cart])
  }

  function confirmRented(books: Book[]): void {
    // create rental using customer id thats selected
    let rentevent: RentReport = rentevents.filter(event => event.customer.id === selectedCustomer.id)[0]
    let rentEventLeft: RentReport[] = rentevents.filter(event => event.customer.id !== selectedCustomer.id)

    rentevent.booksRented = [...books, ...rentevent.booksRented]
    rentevent.books = rentevent.booksRented.length
    setRentEvents([rentevent, ...rentEventLeft]);
    const { charges } = ChargeCalculator([rentevent, ...rentEventLeft])
    setCharges(charges)
  }

  function SelectCustomer(customer: string): void {
    setSelectedCustomer(new Customer(customer))
  }

  return !loadedData
    // show spinner
    ? <div className="preloader">
      <Spinner />
    </div>

    // show all the routes we need
    : <Router>
      <div>

        <Switch>
          <Route path="/debug">
            <Navbar cart={cart} selectedCustomer={selectedCustomer} customers={customers} selectCustomer={SelectCustomer} />
            <Debug_Ui data={[books, customers, rentevents]} />
          </Route>
          <Route path="/charges">
            <Navbar cart={cart} selectedCustomer={selectedCustomer} customers={customers} selectCustomer={SelectCustomer} />
            <ChargesUI charges={charges} />
          </Route>
          {/* <Route path="/pos">
            <Navbar cart={cart} selectedCustomer={selectedCustomer} customers={customers} selectCustomer={SelectCustomer} />
            <POS_Ui />
          </Route> */}
          <Route path="/cart">
            <Navbar cart={cart} selectedCustomer={selectedCustomer} customers={customers} selectCustomer={SelectCustomer} />
            <div className="row">
              <div className="col-lg-4">
                <Cart cart={cart} confirmBooks={(books: Book[]) => confirmRented(books)} selectedCustomer={selectedCustomer} setBooks={(books: Book[]) => setCart(books)} />
              </div>
            </div>
          </Route>
          <Route path="/">
            <Navbar cart={cart} selectedCustomer={selectedCustomer} customers={customers} selectCustomer={SelectCustomer} />
            <div className="row">
              <div className="col-lg-9">
                <EcommerceUi books={books} addToUserLiblary={addToUserLiblary} />
              </div>
              <div className="col-lg-3">
                <Cart cart={cart} confirmBooks={(books: Book[]) => confirmRented(books)} selectedCustomer={selectedCustomer} setBooks={(books: Book[]) => setCart(books)} />
              </div>
            </div>
          </Route>
        </Switch>
      </div>
    </Router>

}

export default App;
