import React, {useState} from 'react';
import {Link} from 'react-router-dom';
// CSS
import './Sidebar.css';
// Bootstrap
import {Accordion, Nav} from "react-bootstrap";
import {useAccordionButton} from 'react-bootstrap/AccordionButton';

const MenuToggle = ({children, eventKey}) => {
    const decoratedOnClick = useAccordionButton(eventKey, () => {
        }
    );

    return (
        <Nav.Item
            className="active"
            type="button"
            onClick={decoratedOnClick}
        >
            <Nav.Link>
                {children}
            </Nav.Link>
        </Nav.Item>
    );
}

const SidebarMenu = ({data}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const handleMenuClick = () => {
        setIsMenuOpen(!isMenuOpen);
    }

    return (
        <div className="sidebar-menu">
            <Nav.Item className="mx-2">
                <Accordion defaultActiveKey="1">
                    <MenuToggle eventKey="0">
                        {data.icon}
                        {data.name}
                    </MenuToggle>
                    <Accordion.Collapse
                        eventKey="0"
                    >
                        <Nav className="nav flex-column">
                            {data.sub_routes.map((item, i) => {
                                    if (item.name === undefined) return null
                                    return (
                                        <div
                                            className="sidebar-menu-item"
                                            key={i}
                                        >
                                            <Nav.Item
                                                className="active"
                                                key={i}
                                            >
                                                <Nav.Link as={Link} to={item.path}>
                                                    {item.icon}
                                                    {item.name}
                                                </Nav.Link>
                                            </Nav.Item>
                                        </div>)
                                }
                            )}
                        </Nav>
                    </Accordion.Collapse>
                </Accordion>
            </Nav.Item>
        </div>
    )
}

export default SidebarMenu;