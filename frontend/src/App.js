import logo from './logo.svg';
import './App.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css'
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css'
import Home from "./pages/Home";
import Login from "./components/Login";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
            <Navbar expand="lg" className="bg-body-tertiary">
              <Container>
                <Navbar.Brand href="/">React-Bootstrap</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                  <Nav className="me-auto">
                    <Nav.Link href="/">Home</Nav.Link>
                    <Nav.Link href="/loops">Loops</Nav.Link>
                    <Nav.Link href="/conditions">Conditions</Nav.Link>
                    <Nav.Link href="/reducer">Reducer</Nav.Link>
                    <Nav.Link href="/fetch_data_reducer">Fetch Data with Reducer</Nav.Link>
                    <Nav.Link href="/login">Login</Nav.Link>
                    <Nav.Link href="/simple_blog_posts">Simple Blog Posts</Nav.Link>
                    <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                      <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                      <NavDropdown.Item href="#action/3.2">
                        Another action
                      </NavDropdown.Item>
                      <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item href="#action/3.4">
                        Separated link
                      </NavDropdown.Item>
                    </NavDropdown>
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>
        <Routes>
          <Route path="/" element={<Home />} />

          {/*<Route path="/loops" element={<Loops />} />*/}
          {/*<Route path="/conditions" element={<Conditions />} />*/}
          {/*<Route path="/reducer_demo" element={<ReducerDemo />} />*/}
          {/*<Route path="/fetch_data_reducer" element={<FetchdataReducer />} />*/}
          <Route path="/login" element={<Login />} />
          {/*<Route path="/simple_blog_posts" element={<SimpleBlogPosts />} />*/}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
