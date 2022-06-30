import React, {useEffect, useState} from "react";
import {Link, Navigate, useNavigate} from "react-router-dom";
import "./RenderABTest.css"
import Spinner from "react-bootstrap/Spinner";
import {CardComponent, Table} from "../../components";
import axios from 'axios';
import {Container} from "react-bootstrap";
import {CircularProgress} from "@material-ui/core";

function RenderABTests() {
    const [data, setData] = useState([])
    const navigate = useNavigate()
    const [datamap, setDatamap] = useState({})
    const [response, setResponse] = useState(undefined)
    const [isLoaded, setIsLoaded] = useState(false)
    const [forbiddenAccess, setForbiddenAccess] = useState(false);
    const [allDataFetched, SetAllDataFetched] = useState(false);
    const [algoritmes, setAlgoritmes] = useState({})
    const [alldone, setAlldone] = useState({})

    useEffect(() => {
        axios
            .get("tests?id:distinct&_page_size=42069",
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((dbResponse) => {
                if (dbResponse.status === 200) {
                    setResponse(dbResponse)
                    setIsLoaded(true)
                } else {
                    console.log(dbResponse)
                    alert("You don't have admin access or your request could not have been completed.")
                    navigate('/dashboard')
                }
            }).catch((error) => {
            console.log(error)

            setForbiddenAccess(true)
        });


    }, []);

    const gettime = (date) => {
        const d = new Date();
        d.setHours(date[0])
        d.setMinutes(date[1])
        d.setSeconds(date[2])
        const p = new Date(Date.now());
        const curr = p.getTime() - d.getTime();
        const hours = parseInt(Math.abs(curr) / (1000 * 60 * 60) % 24);
        const minutes = parseInt(Math.abs(p.getTime() - d.getTime()) / (1000 * 60) % 60);
        const seconds = parseInt(Math.abs(p.getTime() - d.getTime()) / (1000) % 60);
        return `${hours} h ${minutes} min ${seconds} s`
    }

    useEffect(() => {
        if (isLoaded) {
            response.data.data.list.map((entry, index) => {
                if (data.length - 1 >= index) {
                    return null
                }
                datamap[entry.id] = index
                data[index] = {}
                data[index]["test_id"] = entry.id
                data[index]["dataset"] = entry.dataset_name
                data[index]["step_size"] = entry.step_size
                data[index]["begin_date"] = entry.begin
                data[index]["end_date"] = entry.end
                setDatamap(datamap)
                axios
                    .get(`/tests/${entry.id}/algorithms`, {
                        headers: {
                            "Authorization": "Bearer " + localStorage.getItem("token")
                        }
                    })
                    .then(res => {
                        data[index]["algorithm"] = String(res.data.data.list.map((alg, index) => alg.name));
                        algoritmes[index] = String(res.data.data.list.map((alg, index) => alg.name));
                    })
                    .then(() => {setData(JSON.parse(JSON.stringify(data))); setAlgoritmes(algoritmes)}
                    )
                axios
                    .get("/tests/" + entry.id + "/eta_duration",
                        {
                            headers: {
                                "Authorization": "Bearer " + localStorage.getItem("token")
                            }
                        })
                    .then((response) => {
                        // console.log("ETA: ", entry.id, response)
                        if (response['data'] === null) {
                            data[index]["status"] = "Loading..."
                        } else if (response['data']['done'] === true) {
                            data[index]["status"] = "Done"
                        } else if (response['data']['estimated_time'] === -1) {
                            data[index]['status'] = "Starting..."
                        } else if (response['data']['start_db_time'] !== -1 && response['data']['pushing_to_db'] === true) {
                            data[index]['status'] = `Done, pushing to database ${gettime(JSON.parse(response['data']['start_db_time']))}`
                        } else {
                            const time = JSON.parse(response['data']['estimated_time'])
                            data[index]["status"] = `the estimated runtime is: ${time[0]} h ${time[1]} min ${time[2]} s`
                        }
                    }).then(() => setData(JSON.parse(JSON.stringify(data)))
                ).then(() => SetAllDataFetched(true)
                ).catch((error) => {
                    console.log(error)
                    setForbiddenAccess(true)
                })
            })
        }
    }, [isLoaded])

    useEffect(() => {
        if (allDataFetched) {
            const interval = setInterval(() => {
                response.data.data.list.map((entry) => {
                    let index = datamap[entry.id]
                    if(Object.keys(alldone).length !== response.data.data.list.length){
                    axios.get("/tests/" + entry.id + "/eta_duration",
                            {
                                headers: {
                                    "Authorization": "Bearer " + localStorage.getItem("token")
                                }
                            })
                        .then((response) => {
                            console.log("ETA: ", entry.id, response['data'])
                            if (response['data'] === null) {
                                data[index]["status"] = "Loading..."
                            } else if (response['data']['done'] === true) {
                                data[index]["status"] = "Done"
                                alldone[index] = 1;
                                setAlldone(alldone);
                            } else if (response['data']['estimated_time'] === -1) {
                                data[index]['status'] = "Starting..."
                            } else if (response['data']['start_db_time'] !== -1 && response['data']['pushing_to_db'] === true) {
                                data[index]['status'] = `Done, pushing to database ${gettime(JSON.parse(response['data']['start_db_time']))}`
                            } else {
                                const time = JSON.parse(response['data']['estimated_time'])
                                data[index]["status"] = `the estimated runtime is: ${time[0]} h ${time[1]} min ${time[2]} s`
                            }
                            data[index]["algorithm"] = algoritmes[index]
                        }).then(() => setData(JSON.parse(JSON.stringify(data)))
                    ).catch((error) => {
                        console.log(error)
                        setForbiddenAccess(true)
                    })
                   }
                })
            }, 10000);
             return () => clearInterval(interval);
    }

    }, [allDataFetched]);

    if (forbiddenAccess) {
        return (
            <Navigate to="/dashboard"/>
        )
    }

    if (!(isLoaded)) {
        return (<Spinner animation="border" role="status"/>)
    }

    for (let index = 0; index < response.data.data.list.length; index++) {
        if (data.length - 1 < index || Object.keys(data[index]).length < 6) {
            return (<Spinner animation="border" role="status"/>)
        }
    }

    function getColumns() {
        return ([
            {
                name: 'test_id',
                selector: row => row.test_id,
                sortable: true,
                cell: row => (
                    (row.status === "Done") ? <Link to={`/dashboard/${row.dataset}/test/${row.test_id}`}
                                                    style={{textDecoration: 'none'}}>{row.test_id}</Link> :
                        <div>{row.test_id}</div>
                )
            },
            {
                name: 'dataset',
                selector: row => row.dataset,
                sortable: true,
            },
            {
                name: 'step_size',
                selector: row => row.step_size,
                sortable: true,
            },
            {
                name: 'algorithm',
                selector: row => row.algorithm,
                sortable: true,
            },
            {
                name: 'begin_date',
                selector: row => new Date(row.begin_date).toISOString().split('T')[0],
                sortable: true,
            },
            {
                name: 'end_date',
                selector: row => new Date(row.end_date).toISOString().split('T')[0],
                sortable: true,
            },
            {
                name: 'Status',
                selector: row => row.status,
                sortable: true,
                cell: row => (
                    <div style={{
                        wordbreak: 'break-word',
                        textAlign: 'center',
                        justifyContent: 'center',
                        alignContent: 'center'
                    }}>
                        {row.status}
                        {
                            row.status === 'Done' ? null
                                :
                                <CircularProgress style={{
                                    'color': '#5078CD',
                                    'width': '20px',
                                    'height': '20px',
                                    marginLeft: '30px'
                                }}/>
                        }
                    </div>
                )
            }
        ])
    }

    return (
        <Container fluid className="mt-0 mt-lg-4">
            <CardComponent
                title='Tests'
                link=''
                text={`Overview of all executed tests.`}
                content={
                    !isLoaded && response !== undefined ?
                        <Spinner animation="border" role="status"/>
                        :
                        <Table
                            columns={getColumns()}
                            data={data}
                        />
                }
                options=''
            />
            <br/>
        </Container>

    )
}

export default RenderABTests;