import React from 'react';
import {Link, useLocation} from "react-router-dom";
// CSS
import './Sidebar.css';
// Bootstrap
import {Nav} from 'react-bootstrap';


const SidebarItem = ({text, icon, path}) => {

    const location = useLocation();
    const locationName = location['pathname'].replace('/route/summary/location=', '');


    return (
        <div className="sidebar-item">
            <Nav.Item className="active mx-2">
                <Nav.Link as={Link} to={path}>
                    {icon}
                    {text}
                </Nav.Link>
            </Nav.Item>
        </div>
    )
}

export default SidebarItem;