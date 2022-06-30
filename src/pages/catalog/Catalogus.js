import React, {useState} from "react";
import './Catalogus.css';
import Product_card from "./product_card";
import {Col, Container, Nav, Navbar, NavDropdown, Pagination, Row} from "react-bootstrap";


function Catalogus() {

    let data = [
        ["product info", "https://data.ua-ppdb.me/images/H_M/011/0110065001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/011/0111586001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/011/0111593001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/011/0111609001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/011/0114428026.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/011/0116379047.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/011/0118458028.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0120129001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0120129014.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0120129025.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0123173001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0126589006.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0126589007.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0126589010.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0129085001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0129085026.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/012/0129085027.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/013/0130035001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0144993001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0145872001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0145872037.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0145872043.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0145872051.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0145872052.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0145872053.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0146706001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0146706004.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0146706005.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0146721001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0146721002.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0146730001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0148033001.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/014/0148033006.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/015/0150959011.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/015/0150959013.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/015/0153115019.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/015/0153115020.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/015/0153115021.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/015/0153115039.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/015/0153115040.jpg", "Product name"],
        ["product info", "https://data.ua-ppdb.me/images/H_M/015/0153115043.jpg", "Product name"]
    ]

    let w = window.innerWidth;


    // these are the number of items to be displayed
    let items = data.length - 1;
    let items_per_page = ((w > 400) ? 50 : 20);

    function getItemCount() {
        if (items < items_per_page) {
            return items
        } else {
            return items_per_page;
        }
    }

    function correction() {
        if (items > items_per_page) {
            return items - items_per_page
        } else {
            return items;
        }
    }

    const [counter, setCounter] = useState(getItemCount());
    const [amount, setAmount] = useState(correction());
    const [item_page, setItem_page] = useState(0);


    function getCatalogus() {
        let temp_items = Array.apply(null, Array(Math.ceil((counter))));

        let counter_ = item_page * items_per_page;


        return (
            <div>
                <Row>
                    {temp_items.map((item) => {
                        // items to be included on the product card (more will be added)
                        counter_ += 1;
                        return <Col xs={4} md={3}><Product_card
                            info={data[counter_][0]}
                            img={data[counter_][1]}
                            title={data[counter_][2]}
                        /></Col>
                    })}
                </Row>
            </div>
        );
    }

    return (
        <div>
            <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand href="#home">Catalog overview</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mr-auto">
                            <NavDropdown title="Sort by" id="basic-nav-dropdown">
                                <NavDropdown.Item>option1</NavDropdown.Item>
                                <NavDropdown.Item>option2</NavDropdown.Item>
                                <NavDropdown.Item>option3</NavDropdown.Item>
                                <NavDropdown.Item> . . . </NavDropdown.Item>
                                <NavDropdown.Divider/>
                                <NavDropdown.Item>no sort</NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown title="Size" id="basic-nav-dropdown">
                                <NavDropdown.Item>XS</NavDropdown.Item>
                                <NavDropdown.Item>S</NavDropdown.Item>
                                <NavDropdown.Item>M</NavDropdown.Item>
                                <NavDropdown.Item> . . . </NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown title="Color" id="basic-nav-dropdown">
                                <NavDropdown.Item>white</NavDropdown.Item>
                                <NavDropdown.Item>black</NavDropdown.Item>
                                <NavDropdown.Item>green</NavDropdown.Item>
                                <NavDropdown.Item> . . . </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                    <Navbar.Text>{items} items found </Navbar.Text>
                </Container>
            </Navbar>
            <div className="center-col">
                <div className="container">
                    <div>

                        {getCatalogus(counter)}
                        <br/>
                        <Row className="justify-content-md-center">
                            <Col xs lg="2">
                                <Pagination>
                                    <Pagination.First onClick={() => {

                                        setItem_page(0);
                                        setAmount(correction());
                                        setCounter(items_per_page);

                                    }} disabled={item_page === 0}/>
                                    <Pagination.Prev onClick={() => {

                                        setItem_page(item_page - 1)
                                        if ((item_page * items_per_page) > items - items_per_page) {
                                            setAmount(amount);
                                        } else {
                                            setAmount(amount + items_per_page);
                                        }
                                        setCounter(items_per_page);

                                    }} disabled={item_page === 0}/>
                                    <Pagination.Item>{item_page + 1}</Pagination.Item>
                                    <Pagination.Next onClick={() => {

                                        if (amount - items_per_page < 0) {
                                            setItem_page(item_page + 1)
                                            setCounter(amount)
                                        } else {
                                            setItem_page(item_page + 1)
                                            setAmount(amount - items_per_page)
                                        }
                                    }} disabled={(item_page * items_per_page) >= items - items_per_page}/>
                                    <Pagination.Last onClick={() => {

                                        setAmount(correction() - items_per_page * (Math.ceil(items / items_per_page) - 2))
                                        setItem_page(Math.ceil(items / items_per_page) - 1)
                                        setCounter(correction() - items_per_page * (Math.ceil(items / items_per_page) - 2))

                                    }} disabled={(item_page * items_per_page) >= items - items_per_page}/>
                                </Pagination>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default Catalogus;