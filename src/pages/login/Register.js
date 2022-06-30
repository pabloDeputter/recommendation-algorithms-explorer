import React, {useState} from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {Navigate, useNavigate} from "react-router-dom"
import "./Login.css";
import {Card, Col, Row} from "react-bootstrap";
import loginpic from "../../assets/login_stock.jpg";
import Image from "react-bootstrap/Image";
import axios from "axios";
import Toast from 'react-bootstrap/Toast'
import {Checkbox, FormControlLabel} from "@material-ui/core";

const ErrorToast = () => {

    return (
        <Toast>
            <Toast.Header>
                <strong className="mr-auto">Error</strong>
                <small>11 mins ago</small>
            </Toast.Header>
            <Toast.Body>You're reading this text in a Toast!</Toast.Body>
        </Toast>
    )
}

function Login() {

    const navigate = useNavigate()
    const [username, setUsername] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [psw, setPassword] = useState("");
    const [passwordverify, setPasswordVerify] = useState("");
    const [registered, setRegistered] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error_email, setError_email] = useState(false);
    const [error_username, setError_username] = useState(false);
    const [admin, setAdmin] = useState(false);


    let h = window.innerHeight;
    let w = window.innerWidth;

    const handleSubmit = (event) => {
        event.preventDefault()
        setFetching(true);
        axios
            .post('register_user',
                {
                    username: username.toLowerCase(),
                    password: psw,
                    first_name: firstname,
                    last_name: lastname,
                    email: email.toLowerCase(),
                    admin: admin
                })
            .then(res => res.data)
            .then(res => {
                setFetching(false);
                if (res.status === 200) {
                    navigate("/login")
                }
            })
            .catch(error => {
                alert('Password or Email was already in use, please try again.')
            })
    }


    function validateForm() {
        return !(username.length > 0 && email.length > 0 && psw.length > 0 && passwordverify.length > 0 && psw === passwordverify);
    }

    function VerifyPassword() {
        return (psw === passwordverify || passwordverify.length === 0);
    }

    if (!fetching) {
        return <Navigate to='/login'/>
    }


    return (
        <div className="BackgroundImg">
            <div className="Box_register">
                <Row>
                    <Col>
                        <h2 className="welcome">Welcome to DataHub</h2>
                        <p> This is a web application that facilitates the research, evaluation and comparison of
                            recommendation algorithms. </p>
                        {(w >= 400) ?
                            <Image src={loginpic} alt="login page image" style={{maxHeight: '20rem'}} fluid/> : <br/>}
                    </Col>
                    <Col>
                        <Card className="width_register"
                              style={{minWidth: '14rem', flexGrow: 1, minHeight: '18rem', boxShadow: 'none'}}>
                            <Card.Body>
                                <div className="Login">
                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col>
                                                <Form.Group size="lg" controlId="firstname">
                                                    <Form.Label>Firstname</Form.Label>
                                                    <Form.Control
                                                        autoFocus
                                                        type="firstname"
                                                        value={firstname}
                                                        onChange={(e) => setFirstname(e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col>
                                                <Form.Group size="lg" controlId="lastname">
                                                    <Form.Label>Lastname</Form.Label>
                                                    <Form.Control
                                                        autoFocus
                                                        type="lastname"
                                                        value={lastname}
                                                        onChange={(e) => setLastname(e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group size="lg" controlId="username">
                                            <Form.Label>Username</Form.Label>
                                            <Form.Control
                                                autoFocus
                                                type="username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />
                                        </Form.Group>
                                        <Form.Group size="lg" controlId="email">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                autoFocus
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </Form.Group>
                                        <Form.Group size="lg" controlId="password">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={psw}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </Form.Group>
                                        <Form.Group size="sm" controlId="passwordverify">
                                            <Form.Text className="text">
                                                verify password
                                            </Form.Text>
                                            <Form.Control
                                                type="password"
                                                value={passwordverify}
                                                onChange={(e) => setPasswordVerify(e.target.value)}
                                            />
                                            <Form.Text className="text">
                                                {VerifyPassword() ? <br/> :
                                                    <p className="text-danger">ⓘ passwords are not equal </p>}
                                            </Form.Text>
                                        </Form.Group>
                                        <FormControlLabel
                                            style={{marginTop: '-20px'}}
                                            control={
                                                <Checkbox
                                                    checked={admin}
                                                    onChange={(event) => setAdmin(event.target.checked)}
                                                    inputProps={{'aria-label': 'controlled'}}
                                                    style={{color: '#5078CD'}}
                                                />
                                            }
                                            label="Admin"/>
                                        <div className="d-grid gap-2">
                                            <Button className="btn btn-disabled" role="button" type="submit"
                                                    disabled={validateForm()} onClick={handleSubmit}>
                                                Register
                                            </Button>
                                        </div>
                                    </Form>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default Login;