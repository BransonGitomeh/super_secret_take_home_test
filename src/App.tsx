import React from 'react';
import logo from './logo.svg';
import './App.css';
import moment from "moment";

const Customers = [{
  id: "customer_1"
}]

const Books = [{
  id: "book_1"
}]

const RentedEvents = [{
  rentId: "rent_5_days_ago",
  rentDate: moment().subtract(5, 'd').format('DD-MM-YYYY'),
  customer: "customer_1",
  booksRented: [{
    book: "book_1",
    quantity: 3
  }, {
    book: "book_2",
    quantity: 4
  }]
}]

const Charges = [{

}]


const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
