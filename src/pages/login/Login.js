import React, {useEffect, useState} from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import loginpic from "../../assets/login_stock.jpg";
import "./Login.css";
import {Link, Navigate} from "react-router-dom";
import {Card, Col, Row} from "react-bootstrap";
import Image from "react-bootstrap/Image";
import axios from 'axios';
import {useAxiosClick} from "../../utils/useAxios";
import Toast from "react-bootstrap/Toast";
import storageSystem from "../../utils/storageSystem";

const ErrorToast = (title, text) => {

    return (
        <Toast>
            <Toast.Header>
                <strong className="mr-auto">{title}</strong>
            </Toast.Header>
            <Toast.Body>{text}</Toast.Body>
        </Toast>
    )
}

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const {response, fetching, error, operation} = useAxiosClick();
    const [redirect, setRedirect] = useState(false);

    const email_re = RegExp(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/);


    useEffect(() => {
        // Only run this use effect when there is a token
        const token = localStorage.getItem("token");
        if (token && token !== "" && token !== undefined && token !== null && token !== "null") {
            axios
                .get('get_token',
                    {
                        headers: {
                            ...(localStorage.getItem("token") != undefined && {Authorization: "Bearer " + localStorage.getItem("token")}),
                        }
                    })
                .then(response => {
                    if (response.status !== 200) {
                        return response.data
                    } else {
                        setRedirect(true)
                    }
                })
                .catch( (error) => {return error.data})
        }
    }, []);

    function validateForm() {
        return !(email.length > 0 && email_re.test(email) && password.length > 0);
    }

    function handleLoginSubmit(event) {
        const data = {
            "email": email.toLowerCase(),
            "password": password
        };

        axios
            .post("/token", data)
            .then(response => {
                if (response.status === 200) {
                    setRedirect(true)
                    return response.data
                } else alert("An error occurred!");
            })
            .then(result => {
                localStorage.setItem("token", result["access_token"])
                storageSystem["access_token"] = result["access_token"];
            })
            .catch(error => {
                alert("An incorrect email or password was provided. " +
                    "If you don't have an account yet, you can register below!")
                return error.data
            })

        event.preventDefault();
    }

    //if ((!fetching && response['data']['total'] !== 0)) {
    //    return <Navigate to='dashboard' />
    //}

    if (redirect) {
        return <Navigate to='dashboard'/>
    }

    return ( // token && token!=="" && token!==undefined && token!==null  && token !== "null" ? <Navigate to = 'dashboard' /> : (
        <div>
            <div className="BackgroundImg">
                <div className="Box_login">
                    <Row>
                        <Col>
                            <Card className="width_login"
                                  style={{minWidth: '14rem', flexGrow: 1, minHeight: '18rem', boxShadow: 'none'}}>
                                <Card.Body>
                                    <div className="Login">
                                        <Form onSubmit={handleLoginSubmit}>
                                            <h2>
                                                LOGIN
                                            </h2>
                                            <p>Don't have an account yet? <Link to="/register">sign up</Link></p>
                                            <Form.Group size="lg" controlId="email">
                                                <Form.Label>Email</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </Form.Group>
                                            <br/>
                                            <Form.Group size="lg" controlId="password">
                                                <Form.Label>Password</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                            </Form.Group>
                                            <br/>
                                            <div className="d-grid gap-2">
                                                <Button className="btn btn-disabled" role="button" type="submit"
                                                        disabled={validateForm()} onClick={handleLoginSubmit}>
                                                    Login
                                                </Button>
                                            </div>
                                        </Form>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col>
                            <Image src={loginpic} alt="login page image" fluid/>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
}

export default Login;