import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import {Alert, ButtonGroup, Container, InputGroup, Toast} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import Spinner from "react-bootstrap/Spinner";
import './DetailedABTest.css'
import axios from "axios";
import {CardComponent} from "../../components";
import {Navigate, useNavigate} from "react-router-dom";


function Get(url, setItems, setIsLoaded, setError) {
    fetch(url)
        .then(res => res.json())
        .then(
            (result) => {
                setItems(result);
                setIsLoaded(true);
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                setError(error);
                setIsLoaded(true);
            }
        )
}


function CreateABTest() {
    const [error, setError] = useState(null);
    const [isLoadedAlgorithms, setIsLoadedAlgorithms] = useState(false);
    const [isLoadedDatasets, setIsLoadedDatasets] = useState(false);
    const [isLoadedMinDate, setIsLoadedMinDate] = useState(false);
    const [isLoadedMaxDate, setIsLoadedMaxDate] = useState(false);
    const algorithms = [
        {
            name: "popularity",
            parameters: [
                "window_size",
                "retrain_interval",
            ]
        },
        {
            name: "recency",
            parameters: [
                "retrain_interval",
            ]
        },
        {
            name: "ItemKNN",
            parameters: [
                "window_size",
                "k",
                "retrain_interval"
            ]
        }
    ]
    const [datasets, setDatasets] = useState([]);
    const [minDate, setMinDate] = useState(new Date(0));
    const [maxDate, setMaxDate] = useState(new Date("9999"));

    const [errorSet, setErrorSet] = useState(false);
    const [data, setData] = useState({});
    const [currentAlgorithm, setcurrentAlgorithm] = useState(0);
    const [currentAlgorithmData, setcurrentAlgorithmData] = useState({});
    const [showSuccessful, setSuccessful] = useState(false);
    const [currentEditable, setCurrentEditable] = useState(-1);
    const [forbiddenAccess, setForbiddenAccess] = useState(false);
    const [editParameters, setEditParameters] = useState({})

    const navigate = useNavigate()

    useEffect(() => {
        // Get(`/api/datasets`, setDatasets, setIsLoadedDatasets, setError)
        axios
            .get("datasets",
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then((response) => {
                if (response.status === 200) {
                    setDatasets(response.data)
                    setIsLoadedDatasets(true)
                } else {
                    navigate('/dashboard')
                }
            })
            .catch((error) => {
                let no_auth_codes = [401, 403, undefined]
                if (no_auth_codes.includes(error.status)) {
                    alert("You don't have admin access.")
                    setForbiddenAccess(true)
                } else {
                    console.log(error)
                    setError(true)
                    setIsLoadedDatasets(true)
                    navigate('/dashboard')
                }

            })

    }, [])

    if (forbiddenAccess) {
        return (
            <Navigate to="/dashboard"/>
        )
    }

    if (error != null || errorSet) {
        setErrorSet(true)
        return (
            <Alert variant="danger">
                <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
                <p>{error.toString()}</p>
            </Alert>
        );
    }
    if (!(isLoadedDatasets)) {
        return (<Spinner animation="border" role="status"/>)
    }

    function validateForm() {
        return !("datasetname" in data &&
            "start" in data && "end" in data &&
            data["end"] >= data["start"] &&
            "stepsize" in data &&
            "topk" in data &&
            "algorithms" in data &&
            data["algorithms"].length >= 1)
    }

    function validateAlgorithmForm() {
        return !("parameters" in currentAlgorithmData &&
            Object.keys(currentAlgorithmData["parameters"]).length === algorithms.find(element => element["name"] === currentAlgorithmData["name"]).parameters.length)
    }

    return (
        <Container fluid className="mt-0 mt-lg-4">
            <Form>
                <CardComponent
                    title='Create A/B Test'
                    link=''
                    text={`Choose a dataset to run the recommendation algorithms on and select values for the parameters you want to use.`}
                    content={
                        <><Row className="mb-3">
                            <Form.Group as={Col}>
                                <Form.Select className={"mb-3"}
                                             onChange={(e) => {
                                                 if (e.target.value == -1) {
                                                     delete data["datasetname"]
                                                     setIsLoadedMinDate(false)
                                                     setIsLoadedMaxDate(false)
                                                 } else {
                                                     data["datasetname"] = e.target.value;
                                                     Get('/api/date_boundaries/' + data["datasetname"], (body) => {
                                                         setMinDate(new Date(body[0]['lbound']))
                                                     }, setIsLoadedMinDate, setError)
                                                     Get('/api/date_boundaries/' + data["datasetname"], (body) => {
                                                         setMaxDate(new Date(body[0]['rbound']))
                                                     }, setIsLoadedMaxDate, setError)
                                                 }

                                                 "start" in data && delete data["start"]
                                                 "end" in data && delete data["end"]
                                                 "topk" in data && delete data["topk"]
                                                 "stepsize" in data && delete data["stepsize"]
                                                 setData(JSON.parse(JSON.stringify(data)));
                                             }}
                                             value={"datasetname" in data ? data["datasetname"] : ''}
                                >
                                    <option value={-1}>Datasets</option>
                                    {
                                        datasets['data']['list'].map((dataset, index) => (
                                            <option value={dataset.name} key={`dataset${index}`}>{dataset.name}</option>
                                        ))
                                    }
                                </Form.Select>
                                <Form.Group as={Col}>
                                    <Row>
                                        <Form.Group as={Col}>
                                            <Form.Label>Enter start
                                                day {!("datasetname" in data) || isLoadedMaxDate && isLoadedMinDate ? '' : '(loading...)'}</Form.Label>
                                            <Form.Control type="date"
                                                          min={isLoadedMinDate ? minDate.toISOString().split('T')[0] : ''}
                                                          max={isLoadedMaxDate ? maxDate.toISOString().split('T')[0] : ''}
                                                          disabled={!("datasetname" in data) || !(isLoadedMaxDate && isLoadedMinDate)}
                                                          onChange={(e) => {
                                                              if (new Date(e.target.value) < minDate) {
                                                                  e.target.value = minDate.toISOString().split('T')[0]
                                                              } else if (new Date(e.target.value) > maxDate) {
                                                                  e.target.value = maxDate.toISOString().split('T')[0]
                                                              }
                                                              if ("end" in data && new Date(e.target.value) > new Date(data["end"])) {
                                                                  e.target.value = data["end"]
                                                              }
                                                              data["start"] = e.target.value;
                                                              if (e.target.value === "") {
                                                                  delete data["start"]
                                                              }
                                                              setData(JSON.parse(JSON.stringify(data)));
                                                          }}
                                                          value={"start" in data ? data["start"] : ''}/>
                                        </Form.Group>
                                        <Form.Group as={Col}>
                                            <Form.Label>Enter end
                                                day {!("datasetname" in data) || isLoadedMaxDate && isLoadedMinDate ? '' : '(loading...)'}</Form.Label>
                                            <Form.Control type="date"
                                                          min={isLoadedMinDate ? minDate.toISOString().split('T')[0] : ''}
                                                          max={isLoadedMaxDate ? maxDate.toISOString().split('T')[0] : ''}
                                                          disabled={!("datasetname" in data) || !(isLoadedMaxDate && isLoadedMinDate)}
                                                          onChange={(e) => {
                                                              if (new Date(e.target.value) < minDate) {
                                                                  e.target.value = minDate.toISOString().split('T')[0]
                                                              } else if (new Date(e.target.value) > maxDate) {
                                                                  e.target.value = maxDate.toISOString().split('T')[0]
                                                              }
                                                              if ("start" in data && new Date(e.target.value) < new Date(data["start"])) {
                                                                  e.target.value = data["start"]
                                                              }
                                                              data["end"] = e.target.value;
                                                              if (e.target.value === "") {
                                                                  delete data["end"]
                                                              }
                                                              setData(JSON.parse(JSON.stringify(data)));
                                                          }}
                                                          value={"end" in data ? data["end"] : ''}/>
                                        </Form.Group>
                                        <Form.Group as={Col}>
                                            <Form.Label>Enter step size</Form.Label>
                                            <Form.Control type="number"
                                                          min={1}
                                                          max={"end" in data && "start" in data ? (data["end"] == data["start"] ? 1 : Math.floor((new Date(data["end"]) - new Date(data["start"])) / (24 * 60 * 60 * 1000))) : ''}
                                                          disabled={!("datasetname" in data)}
                                                          onInput={(e) => {
                                                              data["stepsize"] = parseInt(e.target.value);
                                                              setData(JSON.parse(JSON.stringify(data)));
                                                          }}
                                                          value={"stepsize" in data ? data["stepsize"] : ''}/>
                                        </Form.Group>
                                        <Form.Group as={Col}>
                                            <Form.Label>Enter top K</Form.Label>
                                            <Form.Control type="number"
                                                          min={1}
                                                          disabled={!("datasetname" in data)}
                                                          onInput={(e) => {
                                                              data["topk"] = parseInt(e.target.value);
                                                              setData(JSON.parse(JSON.stringify(data)));
                                                          }}
                                                          value={"topk" in data ? data["topk"] : ''}/>
                                        </Form.Group>
                                    </Row>
                                </Form.Group>
                            </Form.Group>

                            <Form.Group as={Col}>
                                <InputGroup className={"mb-3"}>
                                    <Form.Select
                                        onChange={(e) => {
                                            if (!("algorithms" in data)) {
                                                data["algorithms"] = []
                                            }
                                            if (e.target.value === "-1") {
                                                setcurrentAlgorithmData({})
                                                return
                                            } else {
                                                currentAlgorithmData["name"] = e.target.value
                                            }
                                            setcurrentAlgorithmData(JSON.parse(JSON.stringify(currentAlgorithmData)))
                                        }}
                                        value={!("name" in currentAlgorithmData) ? '' : currentAlgorithmData["name"]}>
                                        <option value={-1}>Algorithms</option>
                                        {algorithms.map((alg, index) => (
                                            <option value={alg.name} key={`algorithm${index}`}>{alg.name}</option>
                                        ))}
                                    </Form.Select>
                                    <Button
                                        disabled={validateAlgorithmForm()}
                                        onClick={() => {
                                            data["algorithms"].push(JSON.parse(JSON.stringify(currentAlgorithmData)))
                                            setData(JSON.parse(JSON.stringify(data)))
                                            setcurrentAlgorithmData({})
                                            setcurrentAlgorithm(currentAlgorithm + 1);
                                        }}>Add</Button>
                                </InputGroup>
                                <Form.Group as={Col}>
                                    <Row>
                                        {!("name" in currentAlgorithmData) ? null :
                                            <RenderAlgorithmParameters
                                                parameters={algorithms.find(element => element["name"] === currentAlgorithmData["name"]).parameters}
                                                data={currentAlgorithmData}
                                                setData={setcurrentAlgorithmData}
                                            />
                                        }
                                    </Row>
                                </Form.Group>
                            </Form.Group>
                        </Row>
                            <Row>
                                <Col xs={6}>
                                    <Toast show={showSuccessful}
                                           onClose={() => setSuccessful(false)}>
                                        <Toast.Header>
                                            <strong className="me-auto">POST request</strong>
                                        </Toast.Header>
                                        <Toast.Body>The test is successfully created!</Toast.Body>
                                    </Toast>
                                </Col>
                                <Col xs={6}>
                                    {
                                        !("algorithms" in data) ? null : data["algorithms"].map((obj, alg_index) => {
                                            if (!("parameters" in obj)) {
                                                return null
                                            }
                                            // return (<Form className={"pt-3"} key={alg_index}>
                                            return (<div key={alg_index} className={"pt-3"}>
                                                    <InputGroup>
                                                        <Form.Select disabled={alg_index !== currentEditable}>
                                                            <option>{obj.name}</option>
                                                        </Form.Select>
                                                        <ButtonGroup>
                                                            <Button hidden={currentEditable === alg_index}
                                                                    onClick={() => setCurrentEditable(alg_index)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button hidden={currentEditable !== alg_index}
                                                                    onClick={(event) => {
                                                                        setCurrentEditable(-1);
                                                                        Object.entries(editParameters).map((tuple, i) => {
                                                                            obj["parameters"][tuple[0]] = tuple[1]
                                                                            delete editParameters[tuple[0]]
                                                                        })
                                                                    }}
                                                            >
                                                                Submit
                                                            </Button>
                                                            <Button
                                                                onClick={(event) => {
                                                                    setCurrentEditable(-1);
                                                                    data["algorithms"].splice(alg_index, 1)
                                                                    setcurrentAlgorithm(currentAlgorithm - 1)
                                                                    setData(JSON.parse(JSON.stringify(data)))
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </ButtonGroup>
                                                    </InputGroup>
                                                    <Form.Group as={Col}>
                                                        <Row>
                                                            {
                                                                !("parameters" in obj) ? null : Object.entries(obj.parameters).map((tuple, tuple_index) => {
                                                                    return (
                                                                        <Form.Group as={Col}
                                                                                    key={`param${tuple_index}`}>
                                                                            <Form.Label>{tuple[0]}</Form.Label>
                                                                            <Form.Control
                                                                                disabled={alg_index !== currentEditable}
                                                                                type="number"
                                                                                {...((currentEditable !== alg_index && {value: parseInt(tuple[1])}) || {defaultValue: parseInt(tuple[1])})}
                                                                                onChange={(event => {
                                                                                    editParameters[tuple[0]] = event.target.value
                                                                                })}/>
                                                                        </Form.Group>)
                                                                })
                                                            }
                                                        </Row>
                                                    </Form.Group>
                                                </div>
                                                // </Form>
                                            )
                                        })
                                    }
                                </Col>
                            </Row>
                            <Row className={"justify-content-md-end m-3"}>
                                <Button variant="primary" type="submit" className={"float-end"} style={{maxWidth: 200}}
                                        disabled={validateForm()}
                                        onClick={e => {
                                            axios.post("/test", {data}, {
                                                headers: {
                                                    Authorization: "Bearer " + localStorage.getItem("token")
                                                }
                                            }).then(result => {
                                                setSuccessful(true)
                                                return result
                                            }, (error => console.log(error))).finally(() => setData({}))
                                            e.preventDefault()
                                        }}>
                                    Submit
                                </Button>
                            </Row>
                        </>
                    }
                />
            </Form>
        </Container>
    )
}

function RenderAlgorithmParameters({parameters, data, setData}) {
    return (
        parameters.map((name, index) => {
            return (
                <Form.Group as={Col} key={`param${index}`}>
                    <Form.Label>{name}</Form.Label>
                    <Form.Control type="number" placeholder={name} aria-label={name} min={1} onInput={(e) => {
                        if (!("parameters" in data)) {
                            data["parameters"] = {}
                        }
                        data["parameters"][name] = parseInt(e.target.value);
                        setData(JSON.parse(JSON.stringify(data)));
                    }}/>
                </Form.Group>)
        })
    )
}

export default CreateABTest;