// React
import React, {useEffect, useState} from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import './App.css';
// Bootstrap
import './bootstrap.min.css';

import DashboardLayout from './layout/DashboardLayout';
import {Login, Register} from "./pages";
import axios from "axios";

const App = () => {

    const [redirect, setRedirect] = useState(null);
    let UN_AUTH_PAGES = ['/login', '/register', '/']

    useEffect(() => {
        //alert(localStorage.getItem("token"))
        if (localStorage.getItem("token") === undefined) {
            setRedirect(true)
        } else {
            setRedirect(false)
        }
        if (localStorage.getItem("token") !== undefined && !UN_AUTH_PAGES.includes(window.location.pathname)) {
            axios
                .get('get_token',
                    {
                        headers: {
                            ...(localStorage.getItem("token") !== undefined && {Authorization: "Bearer " + localStorage.getItem("token")}),
                        }
                    })
                .then(response => {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem("token")}`;
                    if (response.status !== 200) {
                        setRedirect(true)
                        return response.data
                    }
                })
                .catch(error => {
                    setRedirect(true)
                })
        }
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path='*' element={<Login/>}/>
                <Route path='login' element={<Login/>}/>
                <Route path='register' element={<Register/>}/>
                <Route path='dashboard/*' element={redirect ?
                    <Navigate to="/" replace={redirect !== null}/>
                    :
                    <DashboardLayout/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;