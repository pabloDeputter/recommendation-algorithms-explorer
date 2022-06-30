// React
import React, {Suspense, useEffect, useState} from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
// Bootstrap
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from 'react-bootstrap/Spinner';
// Components
import {Sidebar, Topbar} from '../components/index';
// Pages
import routes from "../routes/Routes";
import './DashboardLayout.css';
import classNames from "classnames";


const Page404 = React.lazy(() => import('../pages/404/Page404'));


const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(
        localStorage.getItem('sidebar-open') === 'true'
    );

    const path = useLocation();

    const onSideBarOpen = () => {
        setIsSidebarOpen(!isSidebarOpen);
    }

    useEffect(() => {
        localStorage.setItem('sidebar-open', isSidebarOpen)
    }, [isSidebarOpen])

    return (
        <>
            <Topbar
                style={{overflow: 'auto', position: 'relative'}}
                onSideBarOpen={onSideBarOpen}
            />
            <Container fluid className={"h-100 content-container pl-0 pr-0"}>
                <Row className={"h-100"}>
                    <Sidebar isSidebarOpen={isSidebarOpen}/>
                    <Col className={classNames("dashboard-main-content", {"open": isSidebarOpen})}
                         style={isSidebarOpen ? {maxWidth: '85%'} : {maxWidth: '100%'}}>
                        <Suspense fallback={<Spinner animation="border" role="status"/>}>
                            <Routes>
                                {routes.map((route, index) => (
                                    route.sub_routes ?
                                        route.sub_routes.map((sub_route, i) => (
                                            <Route
                                                path={sub_route.path}
                                                key={i}
                                                element={<sub_route.component/>}
                                            />
                                        ))
                                        :
                                        <Route
                                            path={route.path}
                                            key={index}
                                            element={<route.component/>}
                                        />
                                ))}
                            </Routes>
                        </Suspense>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default DashboardLayout;


// // React
// import React, {Suspense, useEffect, useState} from 'react';
// import {Route, Routes, useLocation} from 'react-router-dom';
// // Bootstrap
// import Container from "react-bootstrap/Container";
// import Row from "react-bootstrap/Row";
// import Col from "react-bootstrap/Col";
// import Spinner from 'react-bootstrap/Spinner';
// // Components
// import {Sidebar, Topbar} from '../components/index';
// // Pages
// import routes from "../routes/Routes";
// import './DashboardLayout.css';
//
//
// const Page404 = React.lazy(() => import('../pages/404/Page404'));
//
//
// const DashboardLayout = () => {

//     const [redirect, setRedirect] = useState(false);
//
//     const path = useLocation();
//
//     const onSideBarOpen = () => {
//         setIsSidebarOpen(!isSidebarOpen);
//     }
//
//     const [width, setWidth] = useState(window.innerWidth);
//     const handleWindowResize = () => {
//         setWidth(window.innerWidth);
//     }
//
//     useEffect(() => {
//         window.addEventListener('resize', handleWindowResize);
//         return () => {
//             window.removeEventListener('resize', handleWindowResize);
//         }
//     }, []);
//

//
//     return (
//         <>
//             <Topbar
//                 style={{overflow: 'auto', position: 'relative'}}
//                 onSideBarOpen={onSideBarOpen}
//             />
//             <Container fluid className="dashboard-container">
//                 <Row className={"h-100"}>
//                     <Col lg="2" className="position-fixed">
//                         <Sidebar isSidebarOpen={isSidebarOpen}/>
//                     </Col>
//                     {/*<div className={`banner ${active ? "active" : ""}`}>{children}</div>*/}
//                     {
//                         width <= 991 && isSidebarOpen ? null
//                             :
//                             <Col className={`${isSidebarOpen ? 'offset-lg-2' : 'offset-lg-0'}`}>
//                                 <Suspense fallback={<Spinner animation="border" role="status"/>}>
//                                     <Routes>
//                                         {routes.map((route, index) => (
//                                             route.sub_routes ?
//                                                 route.sub_routes.map((sub_route, i) => (
//                                                     <Route
//                                                         path={sub_route.path}
//                                                         key={i}
//                                                         element={<sub_route.component/>}
//                                                     />
//                                                 ))
//                                                 :
//                                                 <Route
//                                                     path={route.path}
//                                                     key={index}
//                                                     element={<route.component/>}
//                                                 />
//                                         ))}
//                                     </Routes>
//                                 </Suspense>
//                             </Col>
//                     }
//                 </Row>
//             </Container>
//         </>
//     )
// }
//
// export default DashboardLayout;