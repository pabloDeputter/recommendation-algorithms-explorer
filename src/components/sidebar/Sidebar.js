import React from 'react';
import classNames from 'classnames';
import SidebarItem from './SidebarItem';
import SidebarMenu from './SidebarMenu';
// CSS
import './Sidebar.css';
// Bootstrap
import {Nav} from "react-bootstrap";
// Icons
import routes from "../../routes/Routes";

const Sidebar = ({isSidebarOpen}) => {

    return (
        <div className={classNames("sidebar", {"open": isSidebarOpen})}>
            <Nav className="flex-column">
                {routes.map((route, index) => (
                    route.icon ?
                        route.sub_routes ?
                            <SidebarMenu
                                key={index}
                                data={route}
                            />
                            :
                            <SidebarItem
                                key={index}
                                text={route.name}
                                icon={route.icon}
                                path={route.path}
                            />
                        :
                        <div key={index}/>
                ))}

                {/*<SidebarMenu data={datasets} />*/}
                {/*<SidebarMenu data={abtests} />*/}
                {/*<SidebarItem text={'Catalog'} icon={<ShoppingCartIcon className="sidebar-icon" />} />*/}
                {/*<SidebarItem text={'History'} icon={<ClockIcon className="sidebar-icon" />} route={props.onContentChange(1)} />*/}
                {/*<SidebarItem text={'Settings'} icon={<CogIcon className="sidebar-icon" />} />*/}
            </Nav>
        </div>
    )
}

export default Sidebar;