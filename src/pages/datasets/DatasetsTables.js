// React
import React, {useEffect, useState} from 'react';
// Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
// Stuff
import {CardComponent, Table} from '../../components/index';
import Spinner from "react-bootstrap/Spinner";
import {Link, useParams} from "react-router-dom";
import DatasetStatistics from "./DatasetStatistics";
import axios from "axios";
import Image from "react-bootstrap/Image";
import {Card} from "react-bootstrap";


// Function to execute when row is expanded in table
const Expanded = ({data}) => {
    return (
        <pre>
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}


const DatasetsTables = () => {
    // krijg dataset_name van de url
    const {dataset_name} = useParams();

    const [usersData, setUsersData] = useState([]);
    const [itemsData, setItemsData] = useState([]);
    const [usersDataCount, setUsersDataCount] = useState(0);
    const [itemsDataCount, setItemsDataCount] = useState(0);
    const [userColumns, setUserColumns] = useState({});
    const [itemColumns, setItemColumns] = useState({});
    const [userHeaders, setUserHeaders] = useState([]);
    const [itemHeaders, setItemHeaders] = useState([]);

    const [description, setDescription] = useState("");
    const [response, setResponse] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (fetching)
            return;
        setFetching(true);
        axios.get(`${dataset_name}/overview/tables`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token"),
            }
        }).then(result => setResponse(result.data))
            .catch(error => setError(error))
            .finally(() => setFetching(false))
    }, [])

    useEffect(() => {
        // Voorlopig statisch, ma kunnen dynamisch zijn voor metadata enzo
        let columnsUser = [
            {
                name: 'user_id',
                selector: row => row.user_id,
                sortable: true,
                cell: row => (
                    <Link to={`/dashboard/${dataset_name}/users/${row.user_id}`}
                          style={{textDecoration: 'none'}}>{row.user_id}</Link>
                )
            }
        ];
        columnsUser = columnsUser.concat(Object.keys(userColumns).map(key => {
            return {
                name: key,
                selector: row => row[key],
                sortable: true,
                cell: row => {
                    if (userColumns[key] === "url") {
                        return <Image src={row[key]} width={'100%'} rounded className={"p-3"}/>
                    } else {
                        return row[key]
                    }
                }
            }
        }));
        setUserHeaders(columnsUser);
    }, [userColumns])

    useEffect(() => {
        let columnsItems = [
            {
                name: 'item_id',
                selector: row => row.item_id,
                sortable: true,
                cell: row => (
                    <Link to={`/dashboard/${dataset_name}/items/${row.item_id}`}
                          style={{textDecoration: 'none'}}>{row.item_id}</Link>
                )
            },
            {
                name: 'name',
                selector: row => row.name,
                sortable: true,
                cell: row => (row.name)
            }
        ]
        columnsItems = columnsItems.concat(Object.keys(itemColumns).map(key => {
            return {
                name: key,
                selector: row => row[key],
                sortable: true,
                cell: row => {
                    if (itemColumns[key] === "url") {
                        return <Image src={row[key]} width={'100%'} rounded className={"p-3"}/>
                    } else {
                        return row[key]
                    }
                }
            }
        }));
        setItemHeaders(columnsItems);
    }, [itemColumns])

    useEffect(() => {
        axios.get(`metadata/${dataset_name}/users?begin=1&end=10&total=${usersDataCount}`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        })
            .then(result => {
                let emptyAfter = Array(Math.max(usersDataCount - 10, 0)).fill({});
                setUsersData(result.data.concat(emptyAfter));
                // setUsersData(result.data)
            });
    }, [usersDataCount])

    useEffect(() => {
        axios.get(`metadata/${dataset_name}/items?begin=1&end=10&total=${itemsDataCount}`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        })
            .then(result => {
                let emptyAfter = Array(Math.max(itemsDataCount - 10, 0)).fill({});
                setItemsData(result.data.concat(emptyAfter));
                // setItemsData(result.data)
            });
    }, [itemsDataCount])

    useEffect(() => {
        if (response !== null) {
            setUserColumns(response['user_types']);
            setItemColumns(response['item_types']);
            setUsersDataCount(response['users_count']);
            setItemsDataCount(response['items_count']);
            setDescription(response['description']);
        }
    }, [response]);

    return (
        <Container fluid className="mt-0 mt-lg-4">
            {description == null || description === 'null' ? <></> : <>
                <Row>
                    <Col>
                        <Card className="card-component">
                            <Card.Body className="card-component-body">
                                <div className="card-component-text">
                                    <div className="card-component-text-title"> Description</div>
                                    <div className="card-component-text-sub">{description}</div>
                                </div>
                            </Card.Body>
                            <div className="card-component-divider"/>
                        </Card>
                    </Col>
                </Row>
                <br/>
            </>
            }
            <Row>
                <Col>
                    <CardComponent
                        title='User data'
                        text={`this table contains all the users of ${dataset_name}. By clicking the id you will be directed to the page of that user. 
                                this page contains information about the top-k recommendations at various times for that item.`}
                        content={
                            fetching ?
                                <Spinner animation="border" role="status"/>
                                :
                                <Table
                                    columns={userHeaders}
                                    data={usersData}
                                    onChangePage={page => {
                                        axios.get(`metadata/${dataset_name}/users?begin=${(page - 1) * 10 + 1}&end=${page * 10}`,
                                            {
                                                headers: {
                                                    Authorization: "Bearer " + localStorage.getItem("token"),
                                                }
                                            })
                                            .then(result => {
                                                let emptyBefore = Array(Math.max((page - 1) * 10, 0)).fill({});
                                                let emptyAfter = Array(Math.max(usersDataCount - page * 10, 0)).fill({});
                                                setUsersData(emptyBefore.concat(result.data).concat(emptyAfter));
                                            });
                                    }
                                    }
                                />
                        }
                        options=''
                    />
                </Col>
                <Col>
                    <CardComponent
                        title='Item data'
                        text={`this table contains all the users of ${dataset_name}. By clicking the id you will be directed to the page of that item. 
                                In the item page you can find information and statistics regarding the item.`}
                        content={
                            fetching ?
                                <Spinner animation="border" role="status"/>
                                :
                                <Table
                                    columns={itemHeaders}
                                    data={itemsData}

                                    onChangePage={page => {
                                        axios.get(`metadata/${dataset_name}/items?begin=${(page - 1) * 10 + 1}&end=${page * 10}`,
                                            {
                                                headers: {
                                                    Authorization: "Bearer " + localStorage.getItem("token"),
                                                }
                                            })
                                            .then(result => {
                                                let emptyBefore = Array(Math.max((page - 1) * 10)).fill({});
                                                let emptyAfter = Array(Math.max((itemsDataCount - page) * 10)).fill({});
                                                setItemsData(emptyBefore.concat(result.data).concat(emptyAfter));
                                            });
                                    }
                                    }
                                />
                        }
                        options=''
                    />
                </Col>
            </Row>
            <br/>
            <Row>
                <Col>
                    <DatasetStatistics datasetName={dataset_name}/>
                </Col>
            </Row>

        </Container>
    );
}

export default DatasetsTables;