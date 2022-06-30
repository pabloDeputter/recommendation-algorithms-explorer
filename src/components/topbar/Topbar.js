import React, {useEffect, useState} from "react";
import Container from "react-bootstrap/Container"
import Nav from "react-bootstrap/Nav"
import Navbar from "react-bootstrap/Navbar"
import NavDropdown from "react-bootstrap/NavDropdown"
import Image from "react-bootstrap/Image"
import Dropdown from "react-bootstrap/Dropdown"
import {Link, useNavigate} from "react-router-dom";
import {MenuIcon} from '@heroicons/react/solid';
import axios from "axios";
import "./Topbar.css"
import pic from '../../assets/zeker_niet_sus.jpeg'


const Topbar = ({onSideBarOpen}) => {

    const [getLogout, setLogout] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [username, setUsername] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    function logout() {
        localStorage.setItem("token", null)
        setLogout(true)
        navigate("../")
    }

    useEffect(() => {
        axios.get('current_user', {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        })
            .then(response => {
                if (response.data.name)
                    setUsername(response.data.name);
                if (response.data.admin)
                    setIsAdmin(response.data.admin);
            })
            .catch((error) => {
                console.log(error);
            })
    }, [])

    return (
        <Navbar bg="light" style={{position: 'sticky'}} sticky="top">
            <Container fluid>
                <MenuIcon onClick={onSideBarOpen} className='sidebar-toggle-icon'/>
                <div style={{padding: '5px'}}/>
                <Navbar.Brand as={Link} to='/dashboard'>DataHub</Navbar.Brand>
                <Navbar.Text>Recommendation Simulator and Explorer</Navbar.Text>
                <Navbar.Toggle aria-controls="navbarScroll"/>
                <Navbar.Collapse id="navbarScroll">
                    <Nav
                        className="me-auto my-2 my-lg-0 justify-content-center"
                        style={{maxHeight: '100px'}}
                        navbarScroll
                    >
                        {/*<Link to='/dashboard'>Home</Link>*/}
                        {/* <NavDropdown title="Link" id="navbarScrollingDropdown">
                                <NavDropdown.Item href="#action3" onClick={() => {setAction3(true); setAction4(false);setAction5(false)}}>A/B tests</NavDropdown.Item>
                                <NavDropdown.Item href="#action4" onClick={() => {setAction3(false); setAction4(true);setAction5(false)}}>Catalogus</NavDropdown.Item>
                                <NavDropdown.Item href="#action5" onClick={() => {setAction3(false); setAction4(false);setAction5(true)}}> Create A/B test</NavDropdown.Item>
                            </NavDropdown> */}
                    </Nav>
                    {/*<Form className="d-flex">*/}
                    {/*    <FormControl*/}
                    {/*        type="search"*/}
                    {/*        placeholder="Search"*/}
                    {/*        className="me-2"*/}
                    {/*        aria-label="Search"*/}
                    {/*    />*/}
                    {/*</Form>*/}
                    <Dropdown align={"end"}>
                        <Dropdown.Toggle className="UserIcon navbar" tabIndex={0} role={"img"}>
                            <Image
                                src={pic}
                                roundedCircle={true}
                                height="30"
                                alt="Black and White Portrait of a Man"
                                loading="lazy"
                            />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.ItemText>
                                {username}
                            </Dropdown.ItemText>
                            {isAdmin ?
                                <Dropdown.ItemText>
                                    Admin
                                </Dropdown.ItemText>
                                : <></>
                            }
                            <Dropdown.Divider/>
                            <NavDropdown.Item onClick={logout}>
                                Logout
                            </NavDropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default Topbar;