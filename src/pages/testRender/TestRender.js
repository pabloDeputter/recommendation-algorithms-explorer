// React
import React, {useEffect, useState} from 'react';
// Stuff
import Spinner from "react-bootstrap/Spinner";
import {Link, useNavigate, useParams} from "react-router-dom";
import Container from "react-bootstrap/Container";
import {Card, Col, Row} from "react-bootstrap";
import axios from "axios";
// ###### IMPORTANT ######
// ###### IMPORTANT ######
// CARDS
import {TestTableCard, TestTableCardMulRows} from './TestTableCard';
import OverviewCard from "./OverviewCard";
import {TestGraphCard, TestGraphCard_Mul} from "./TestGraphCard";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import {XCircleIcon} from "@heroicons/react/outline";
import {data} from "autoprefixer";


const TestRender = () => {
    // PARAMS
    const {dataset_name, test_id} = useParams();

    // INFO WICH GRAPH TO SHOW
    const [graphToDisplay, SetGraphToDisplay] = useState({});
    const [currentGraph, SetCurrentGraph] = useState(null);

    // TABS
    const [valueTabs, SetValueTabs] = useState(0);


    const navigate = useNavigate();

    // TEST
    const [fetchingTest, setFetchingTest] = useState(true);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [stepSize, setStepSize] = useState(null);

    // ALGORITHMS
    const [algorithms, setAlgorithms] = useState(null);
    const [fetchingAlgorithms, setFetchingAlgorithms] = useState(true);

    // Top-K recommendations
    const [topkrecom, setTopkrecom] = useState(null);
    const [fetchingTopkrecom, setFetchingTopkrecom] = useState(true);

    // Active users
    const [activeUsers, setActiveUsers] = useState(null)
    const [fetchingActiveUsers, setFetchingActiveUsers] = useState(true);

    // Top-K bought items
    const [topkItems, setTopkItems] = useState(null);
    const [fetchingTopkItems, setFetchingTopkItems] = useState(true);

    // Revenue per day
    const [revenuePerDay, setRevenuePerDay] = useState(null);
    const [fetchingRevenuePerDay, setFetchingRevenuePerDay] = useState(true);

    // Active users per day
    const [activeUsersPerDay, setActiveUsersPerDay] = useState(null);
    const [fetchingActiveUsersPerDay, setFetchingActiveUsersPerDay] = useState(true);

    // Bought per day
    const [boughtPerDay, setBoughtPerDay] = useState(null);
    const [fetchingBoughtPerDay, setFetchingBoughtPerDay] = useState(true);

    // CTR
    const [dataCTR, setDataCTR] = useState({});
    const [fetchingCTR, setFetchingCTR] = useState(true);
    const [CTRcount, setCTRcount] = useState(0);

    // AR@D
    const [dataARD, setDataARD] = useState({});
    const [fetchingARD, setFetchingARD] = useState(true);
    const [ARDcount, setARDcount] = useState(0);

    // ARPU@D
    const [dataARPU, setDataARPU] = useState({});
    const [fetchingARPU, setFetchingARPU] = useState(true);
    const [ARPUcount, setARPUcount] = useState(0);

    // Top K
    const [top_k, setTop_k] = useState(0)

    const [graphs, setGraphs] = useState(false);

    useEffect(() => {
        axios
            .get(`/tests/${encodeURIComponent(dataset_name)}/${encodeURIComponent(test_id)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setTop_k(res['data'][0].top_k)
                    setStepSize(res['data'][0].step_size)
                    const start_date = new Date(res['data'][0].begin).toISOString().split('T')[0];
                    const end_date = new Date(res['data'][0].end).toISOString().split('T')[0];
                    setStartDate(start_date);
                    setEndDate(end_date);
                    setFetchingTest(false);

                    // Fetch algorithms in test
                    getAlgorithms();
                    // Fetch top-k recommendations
                    getTopkRecommendations(start_date, end_date, algorithms);

                    // Fetch active users
                    // Fetch top-k bough items
                    getTopkItems(start_date, end_date);

                    // Get revenue per day
                    getRevenuePerDay(start_date, end_date);
                    // Get active users per day
                    getActiveUsersPerDay(start_date, end_date);
                    // Get bought per day
                    getBoughtPerDay(start_date, end_date);

                    getActiveUsers(start_date, end_date);
                } else {
                    alert('Test does not exist or you are not logged in!')
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                alert('Test does not exist or you are not logged in!')
                navigate('/dashboard');
            })
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isEmpty(dataCTR) && algorithms !== null) {
                let algo_length = algorithms.length

                if (Object.keys(dataCTR).length === algo_length) setFetchingCTR(false)
            }
            if (!isEmpty(dataARD) && algorithms !== null) {
                let algo_length = algorithms.length

                if (Object.keys(dataARD).length === algo_length) setFetchingARD(false)
            }
            if (!isEmpty(dataARPU) && algorithms !== null) {
                let algo_length = algorithms.length

                if (Object.keys(dataARPU).length === algo_length) setFetchingARPU(false)
            }
        }, 5000)
        return () => clearInterval(interval);

    }, [fetchingAlgorithms]);

    function isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    const check_fetching = () => {
        /*
        if (!(isEmpty(dataCTR) || isEmpty(dataARD) || isEmpty(dataARPU) || algorithms === null)) {
            // Our dicts are not empty and we have algorithms loaded up
            let algo_length = algorithms.length
            //alert(typeof dataCTR)
            alert("CTR_length = " + Object.keys(dataCTR).length + ", algoritms length = " + algo_length)
            if (Object.keys(dataCTR).length === algo_length) setFetchingCTR(false)
            if (Object.keys(dataARD).length === algo_length) setFetchingARD(false)
            if (Object.keys(dataARPU).length === algo_length) setFetchingARPU(false)
        }
         */


        if (!isEmpty(dataCTR) && algorithms !== null) {
                    let algo_length = algorithms.length

            if (Object.keys(dataCTR).length === algo_length) setFetchingCTR(false)
        }
        if (!isEmpty(dataARD) && algorithms !== null) {
                    let algo_length = algorithms.length

            if (Object.keys(dataARD).length === algo_length) setFetchingARD(false)
        }
        if (!isEmpty(dataARPU) && algorithms !== null) {
                    let algo_length = algorithms.length

            if (Object.keys(dataARPU).length === algo_length) setFetchingARPU(false)
        }
    }

    useEffect(() => {
        if (!fetchingAlgorithms && algorithms !== null && startDate !== null && endDate !== null) {
            getCTR(startDate, endDate, algorithms);
            getARD(startDate, endDate, algorithms);
            getARPU(startDate, endDate, algorithms);
            // alert(fetchingARPU + " " + fetchingARD + " " + fetchingCTR)
        }
    }, [fetchingAlgorithms])


    const getAlgorithms = () => {
        axios
            .get(`/tests/${encodeURIComponent(test_id)}/algorithms`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    console.log(res['data']['data']['list']);
                    setAlgorithms(res['data']['data']['list'].map((item, index) => (
                        {
                            id: item.id,
                            name: item.name,
                            parameters: item.parameters
                        }
                    )))
                    setFetchingAlgorithms(false)
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    const getTopkRecommendations = (start_date, end_date) => {
        axios
            .get(`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/k_recommendations?k=${encodeURIComponent(20)}&start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setTopkrecom(res['data']['topk_recommendations']);
                    setFetchingTopkrecom(false)
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    const getActiveUsers = (start_date, end_date) => {
        axios
            .get(`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/active_users?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setActiveUsers(res['data']['active_users']);
                    setFetchingActiveUsers(false);
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    const getTopkItems = (start_date, end_date) => {
        axios
            .get(`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/k_items?k=${encodeURIComponent(20)}&start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setTopkItems(res['data']['topk_items']);
                    setFetchingTopkItems(false)
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    const getRevenuePerDay = (start_date, end_date) => {
        axios
            .get(`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/info/revenue_per_day?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setRevenuePerDay(res['data']['revenue_per_day']);
                    setFetchingRevenuePerDay(false)
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    const getActiveUsersPerDay = (start_date, end_date) => {
        axios
            .get(`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/info/active_users_per_day?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setActiveUsersPerDay(res['data']['active_users_per_day']);
                    setFetchingActiveUsersPerDay(false)
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    const getBoughtPerDay = (start_date, end_date) => {
        axios
            .get(`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/info/total_bought_per_day?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setBoughtPerDay(res['data']['total_bought_per_day']);
                    setFetchingBoughtPerDay(false)
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    const getCTR = (start_date, end_date, algo) => {
        algo.map((alg, index) => (
            axios
                .get(`/tests/${encodeURIComponent(test_id)}/ctr/${encodeURIComponent(alg.id)}?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
                    {
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("token")
                        }
                    })
                .then(res => res.data.ctr)
                .then(data => {
                    dataCTR[alg.id] = data;
                    setDataCTR(dataCTR);
                })
        ))
    }

    const getARD = (start_date, end_date, algo) => {
        algo.map((alg, index) => (
            axios
                .get(`/${encodeURIComponent(test_id)}/metrics/ard/${encodeURIComponent(alg.id)}?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&D=${30}`,
                    {
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("token")
                        }
                    })
                .then(res => res.data.ard)
                .then(data => {
                    dataARD[alg.id] = data;
                    setDataARD(dataARD);
                })
        ))
    }

    const getARPU = (start_date, end_date, algo) => {
        algo.map((alg, index) => (
            axios
                .get(`/${encodeURIComponent(test_id)}/metrics/arpu/${encodeURIComponent(alg.id)}?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&D=${30}`,
                    {
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("token")
                        }
                    })
                .then(res => res.data.arpu)
                .then(data => {
                    dataARPU[alg.id] = data;
                    setDataARPU(dataARPU);
                })
        ))
    }


    // // INFO - get all the data for the graphs using the start and end date of the Test. When changing
    // // the moving average window size, multiple requests must be done???
    useEffect(() => {
        if (!fetchingRevenuePerDay && !fetchingActiveUsersPerDay && !fetchingBoughtPerDay &&
            !fetchingCTR && !fetchingARD && !fetchingARPU && algorithms !== null) {

            console.log(revenuePerDay);
            console.log(activeUsersPerDay);
            console.log(dataCTR);
            console.log(dataARD);
            console.log(dataARPU);
            console.log(boughtPerDay)

            SetGraphToDisplay({
                0: {
                    name: 'Revenue Per Day',
                    sub_text: 'Total revenue per day in a given period visualized with a line chart alongside with the Simple Moving Average.',
                    data: revenuePerDay,
                    startDate: startDate,
                    endDate: endDate,
                    param_date: 'purchase_date',
                    param_data: 'revenue',
                    data_border: 'rgb(0,0,0)',
                    data_bg: 'rgba(80,120,205, 0.7)',
                    sma_border: 'rgb(242,92,84)',
                    sma_bg: 'rgb(242,92,84)'
                },
                1: {
                    name: 'Active Users Per Day',
                    sub_text: 'Number of active users per day in a given period visualized with a ling chart alongside the Simple Moving Average.',
                    data: activeUsersPerDay,
                    startDate: startDate,
                    endDate: endDate,
                    param_date: 'purchase_date',
                    param_data: 'active',
                    data_border: 'rgb(0,0,0)',
                    data_bg: 'rgba(80,120,205, 0.7)',
                    sma_border: 'rgb(242,92,84)',
                    sma_bg: 'rgb(242,92,84)'
                },
                2: {
                    name: 'CTR',
                    sub_text: 'click-through rate.',
                    graphnames: algorithms,
                    data: dataCTR,
                    startDate: startDate,
                    endDate: endDate,
                    param_date: 'purchase_date',
                    param_data: 'ctr',
                    data_border: 'rgb(0,0,0)',
                    data_bg: 'rgba(80,120,205, 0.7)',
                    sma_border: 'rgb(242,92,84)',
                    sma_bg: 'rgb(242,92,84)'
                },
                3: {
                    name: 'AR@D',
                    sub_text: 'Attribution Rate ',
                    graphnames: algorithms,
                    data: dataARD,
                    startDate: startDate,
                    endDate: endDate,
                    param_date: 'purchase_date',
                    param_data: 'ard',
                    data_border: 'rgb(0,0,0)',
                    data_bg: 'rgba(80,120,205, 0.7)',
                    sma_border: 'rgb(242,92,84)',
                    sma_bg: 'rgb(242,92,84)'
                },
                4: {
                    name: 'ARPU@D',
                    sub_text: 'Average Revenue Per User',
                    graphnames: algorithms,
                    data: dataARPU,
                    startDate: startDate,
                    endDate: endDate,
                    param_date: 'purchase_date',
                    param_data: 'arpu',
                    data_border: 'rgb(0,0,0)',
                    data_bg: 'rgba(80,120,205, 0.7)',
                    sma_border: 'rgb(242,92,84)',
                    sma_bg: 'rgb(242,92,84)'
                },
                5: {
                    name: 'Bought per day',
                    sub_text: 'Bought per day',
                    data: boughtPerDay,
                    startDate: startDate,
                    endDate: endDate,
                    param_date: 'purchase_date',
                    param_data: 'bought',
                    data_border: 'rgb(0,0,0)',
                    data_bg: 'rgba(80,120,205, 0.7)',
                    sma_border: 'rgb(242,92,84)',
                    sma_bg: 'rgb(242,92,84)'
                }
            })
            setGraphs(true);
        }
    }, [fetchingRevenuePerDay, fetchingActiveUsersPerDay, fetchingBoughtPerDay, fetchingCTR, fetchingARD, fetchingARPU])


    // COLUMNS TO BE USED IN CHILDREN TABLES
    const columnTopkItems = [
        {
            name: 'item_id',
            selector: row => row.item_id,
            sortable: true,
            cell: row => (
                <Link style={{textDecoration: 'none'}}
                      to={`/dashboard/${dataset_name}/test/${test_id}/items/${row.item_id}`}>{row.item_id}</Link>
            )
        },
        {
            name: 'quantity',
            selector: row => row.quantity,
            sortable: true,
        },
    ];
    const columnTopkRecommendations = [
        {
            name: 'rank',
            selector: row => row.rank,
            sortable: true
        },
        {
            name: 'item_id',
            selector: row => row.item_id,
            sortable: true,
            cell: row => (
                <Link style={{textDecoration: 'none'}}
                      to={`/dashboard/${dataset_name}/test/${test_id}/items/${row.item_id}`}>{row.item_id}</Link>
            )
        },
        {
            name: 'quantity',
            selector: row => row.quantity,
            sortable: true,
        },
        {
            name: 'Algorithm',
            selector: row => row.id,
            sortable: true
        }
    ];
    const columnActiveUsers = [
        {
            name: 'user_id',
            selector: row => row.user_id,
            sortable: true,
            cell: row => (
                <Link style={{textDecoration: 'none'}}
                      to={`/dashboard/${dataset_name}/test/${test_id}/users/${row.user_id}`}>{row.user_id}</Link>
            )
        },
        {
            name: 'bought_interval',
            selector: row => row.bought_interval,
            sortable: true,
        },
        {
            name: 'bought_total',
            selector: row => row.bought_total,
            sortable: true
        }
    ];

    return (
        <Container fluid className="justify-content-between align-content-between mt-0 mt-lg-4">
            <Row>
                {/* Column contains general information about test (test_id, interval, parameters of algorithms, ... */}
                <Col>
                    {
                        fetchingAlgorithms || fetchingTest ? <Spinner animation="border" role="status"/> :
                            <OverviewCard
                                test_id={test_id}
                                startDate={startDate}
                                endDate={endDate}
                                stepSize={stepSize}
                                topK={top_k}
                                algorithms={algorithms}
                            />
                    }
                </Col>
            </Row>
            <br/>
            <Row>
                <Col>
                    {
                        fetchingTopkrecom ? <Spinner animation="border" role="status"/> :
                            <TestTableCardMulRows
                                name={'Top-k Recommendations'}
                                sub_text={'Top-k recommended items by algorithms used in AB Test in given period.'}
                                originalData={topkrecom}
                                startDate={startDate}
                                paramK={20}
                                endDate={endDate}
                                columns={columnTopkRecommendations}
                                url={`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/k_recommendations`}
                                param={'topk_recommendations'}
                                amount={algorithms}
                                update_param_k={false}
                            />
                    }
                </Col>
            </Row>
            <br/>
            <Row>
                <Container>
                    {
                        (currentGraph === null) ?
                            <div>
                                <Row>
                                    <Col lg="4" sm="4" className="hover_" onClick={() => {
                                        if(graphs) {
                                            SetCurrentGraph(0)
                                            SetValueTabs(0)
                                        }
                                    }}>
                                        {
                                            !graphs ? <Spinner animation="border" role="status"/> :
                                                <TestGraphCard
                                                    name={graphToDisplay[0]["name"]}
                                                    sub_text={graphToDisplay[0]["sub_text"]}
                                                    data={graphToDisplay[0]["data"]}
                                                    startDate={graphToDisplay[0]["startDate"]}
                                                    endDate={graphToDisplay[0]["endDate"]}
                                                    param_date={graphToDisplay[0]["param_date"]}
                                                    param_data={graphToDisplay[0]["param_data"]}
                                                    data_border={graphToDisplay[0]["data_border"]}
                                                    data_bg={graphToDisplay[0]["data_bg"]}
                                                    sma_border={graphToDisplay[0]["sma_border"]}
                                                    sma_bg={graphToDisplay[0]["sma_bg"]}
                                                    big={false}
                                                />
                                        }
                                    </Col>
                                    <Col lg="4" sm="4" className="hover_" onClick={() => {
                                        if(graphs) {
                                            SetCurrentGraph(1)
                                            SetValueTabs(1)
                                        }
                                    }}>
                                        {
                                            !graphs ? <Spinner animation="border" role="status"/> :
                                                <TestGraphCard
                                                    name={graphToDisplay[1]["name"]}
                                                    sub_text={graphToDisplay[1]["sub_text"]}
                                                    data={graphToDisplay[1]["data"]}
                                                    startDate={graphToDisplay[1]["startDate"]}
                                                    endDate={graphToDisplay[1]["endDate"]}
                                                    param_date={graphToDisplay[1]["param_date"]}
                                                    param_data={graphToDisplay[1]["param_data"]}
                                                    data_border={graphToDisplay[1]["data_border"]}
                                                    data_bg={graphToDisplay[1]["data_bg"]}
                                                    sma_border={graphToDisplay[1]["sma_border"]}
                                                    sma_bg={graphToDisplay[1]["sma_bg"]}
                                                    big={false}
                                                />
                                        }
                                    </Col>
                                    <Col lg="4" sm="4" className="hover_" onClick={() => {
                                        if(graphs) {
                                            SetCurrentGraph(5)
                                            SetValueTabs(5)
                                        }
                                    }}>
                                        {
                                            !graphs ? <Spinner animation="border" role="status"/> :
                                                <TestGraphCard
                                                    name={graphToDisplay[5]["name"]}
                                                    sub_text={graphToDisplay[5]["sub_text"]}
                                                    data={graphToDisplay[5]["data"]}
                                                    startDate={graphToDisplay[5]["startDate"]}
                                                    endDate={graphToDisplay[5]["endDate"]}
                                                    param_date={graphToDisplay[5]["param_date"]}
                                                    param_data={graphToDisplay[5]["param_data"]}
                                                    data_border={graphToDisplay[5]["data_border"]}
                                                    data_bg={graphToDisplay[5]["data_bg"]}
                                                    sma_border={graphToDisplay[5]["sma_border"]}
                                                    sma_bg={graphToDisplay[5]["sma_bg"]}
                                                    big={false}
                                                />
                                        }
                                    </Col>
                                </Row>
                                <br/>
                                <Row>
                                    <Col lg="4" sm="4" className="hover_" onClick={() => {
                                        if(graphs) {
                                            SetCurrentGraph(2)
                                            SetValueTabs(2)
                                        }
                                    }}>
                                        {
                                            !graphs ? <Spinner animation="border" role="status"/> :

                                                <TestGraphCard_Mul
                                                    name={graphToDisplay[2]["name"]}
                                                    graphnames={graphToDisplay[2]["graphnames"]}
                                                    sub_text={graphToDisplay[2]["sub_text"]}
                                                    data={graphToDisplay[2]["data"]}
                                                    startDate={graphToDisplay[2]["startDate"]}
                                                    endDate={graphToDisplay[2]["endDate"]}
                                                    param_date={graphToDisplay[2]["param_date"]}
                                                    param_data={graphToDisplay[2]["param_data"]}
                                                    data_border={graphToDisplay[2]["data_border"]}
                                                    data_bg={graphToDisplay[2]["data_bg"]}
                                                    sma_border={graphToDisplay[2]["sma_border"]}
                                                    sma_bg={graphToDisplay[2]["sma_bg"]}
                                                    big={false}
                                                />
                                        }
                                    </Col>
                                    <Col lg="4" sm="4" className="hover_" onClick={() => {
                                        if(graphs) {
                                            SetCurrentGraph(3)
                                            SetValueTabs(3)
                                        }
                                    }}>
                                        {
                                            !graphs ? <Spinner animation="border" role="status"/> :
                                                <TestGraphCard_Mul
                                                    name={graphToDisplay[3]["name"]}
                                                    graphnames={graphToDisplay[3]["graphnames"]}
                                                    sub_text={graphToDisplay[3]["sub_text"]}
                                                    data={graphToDisplay[3]["data"]}
                                                    startDate={graphToDisplay[3]["startDate"]}
                                                    endDate={graphToDisplay[3]["endDate"]}
                                                    param_date={graphToDisplay[3]["param_date"]}
                                                    param_data={graphToDisplay[3]["param_data"]}
                                                    data_border={graphToDisplay[3]["data_border"]}
                                                    data_bg={graphToDisplay[3]["data_bg"]}
                                                    sma_border={graphToDisplay[3]["sma_border"]}
                                                    sma_bg={graphToDisplay[3]["sma_bg"]}
                                                    big={false}
                                                />
                                        }
                                    </Col>
                                    <Col lg="4" sm="4" className="hover_" onClick={() => {
                                        if(graphs) {
                                            SetCurrentGraph(4)
                                            SetValueTabs(4)
                                        }
                                    }}>
                                        {
                                            !graphs ? <Spinner animation="border" role="status"/> :
                                                <TestGraphCard_Mul
                                                    name={graphToDisplay[4]["name"]}
                                                    graphnames={graphToDisplay[4]["graphnames"]}
                                                    sub_text={graphToDisplay[4]["sub_text"]}
                                                    data={graphToDisplay[4]["data"]}
                                                    startDate={graphToDisplay[4]["startDate"]}
                                                    endDate={graphToDisplay[4]["endDate"]}
                                                    param_date={graphToDisplay[4]["param_date"]}
                                                    param_data={graphToDisplay[4]["param_data"]}
                                                    data_border={graphToDisplay[4]["data_border"]}
                                                    data_bg={graphToDisplay[4]["data_bg"]}
                                                    sma_border={graphToDisplay[4]["sma_border"]}
                                                    sma_bg={graphToDisplay[4]["sma_bg"]}
                                                    big={false}
                                                />

                                        }
                                    </Col>
                                </Row>
                            </div>
                            :
                            <Row>
                                <Card>
                                    <Card.Body>
                                        <div>
                                            <XCircleIcon
                                                onClick={(event) => SetCurrentGraph(null)}
                                                className="float-end"
                                                style={{cursor: 'pointer', width: 30, height: 30, color: '#5078CD'}}
                                            />
                                            {/*<button className="rondje float-end" onClick={(event)=> SetCurrentGraph(null)}> X </button>*/}
                                        </div>
                                        <Tabs
                                            value={valueTabs}
                                            onChange={(event, value) => SetValueTabs(value)}
                                            defaultValue={graphToDisplay[currentGraph]["name"]}
                                            textColor='inherit'
                                            TabIndicatorProps={{
                                                style: {
                                                    backgroundColor: "#5078CD"
                                                }
                                            }}
                                            variant="scrollable"
                                            scrollButtons="auto"
                                            aria-label="scrollable force tabs example"
                                        >
                                            <Tab label={graphToDisplay[0]["name"]}
                                                 value={0}
                                            />
                                            <Tab label={graphToDisplay[1]["name"]}
                                                 value={1}
                                            />
                                            <Tab label={graphToDisplay[5]["name"]}
                                                 value={5}
                                            />
                                            <Tab label={graphToDisplay[2]["name"]}
                                                 value={2}
                                            />
                                            <Tab label={graphToDisplay[3]["name"]}
                                                 value={3}
                                            />
                                            <Tab label={graphToDisplay[4]["name"]}
                                                 value={4}
                                            />
                                        </Tabs>

                                        <br/>
                                        <div>
                                            <div style={{display: valueTabs === 0 ? 'block' : 'none'}}>
                                                <TestGraphCard
                                                    name={graphToDisplay[0]["name"]}
                                                    sub_text={graphToDisplay[0]["sub_text"]}
                                                    data={graphToDisplay[0]["data"]}
                                                    startDate={graphToDisplay[0]["startDate"]}
                                                    endDate={graphToDisplay[0]["endDate"]}
                                                    param_date={graphToDisplay[0]["param_date"]}
                                                    param_data={graphToDisplay[0]["param_data"]}
                                                    data_border={graphToDisplay[0]["data_border"]}
                                                    data_bg={graphToDisplay[0]["data_bg"]}
                                                    sma_border={graphToDisplay[0]["sma_border"]}
                                                    sma_bg={graphToDisplay[0]["sma_bg"]}
                                                    big={true}
                                                />
                                            </div>
                                            <div style={{display: valueTabs === 1 ? 'block' : 'none'}}>
                                                <TestGraphCard
                                                    name={graphToDisplay[1]["name"]}
                                                    sub_text={graphToDisplay[1]["sub_text"]}
                                                    data={graphToDisplay[1]["data"]}
                                                    startDate={graphToDisplay[1]["startDate"]}
                                                    endDate={graphToDisplay[1]["endDate"]}
                                                    param_date={graphToDisplay[1]["param_date"]}
                                                    param_data={graphToDisplay[1]["param_data"]}
                                                    data_border={graphToDisplay[1]["data_border"]}
                                                    data_bg={graphToDisplay[1]["data_bg"]}
                                                    sma_border={graphToDisplay[1]["sma_border"]}
                                                    sma_bg={graphToDisplay[1]["sma_bg"]}
                                                    big={true}
                                                />
                                            </div>
                                            <div style={{display: valueTabs === 5 ? 'block' : 'none'}}>
                                                <TestGraphCard
                                                    name={graphToDisplay[5]["name"]}
                                                    sub_text={graphToDisplay[5]["sub_text"]}
                                                    data={graphToDisplay[5]["data"]}
                                                    startDate={graphToDisplay[5]["startDate"]}
                                                    endDate={graphToDisplay[5]["endDate"]}
                                                    param_date={graphToDisplay[5]["param_date"]}
                                                    param_data={graphToDisplay[5]["param_data"]}
                                                    data_border={graphToDisplay[5]["data_border"]}
                                                    data_bg={graphToDisplay[5]["data_bg"]}
                                                    sma_border={graphToDisplay[5]["sma_border"]}
                                                    sma_bg={graphToDisplay[5]["sma_bg"]}
                                                    big={true}
                                                />
                                            </div>
                                            <div style={{display: valueTabs === 2 ? 'block' : 'none'}}>
                                                <TestGraphCard_Mul
                                                    name={graphToDisplay[2]["name"]}
                                                    graphnames={graphToDisplay[2]["graphnames"]}
                                                    sub_text={graphToDisplay[2]["sub_text"]}
                                                    data={graphToDisplay[2]["data"]}
                                                    startDate={graphToDisplay[2]["startDate"]}
                                                    endDate={graphToDisplay[2]["endDate"]}
                                                    param_date={graphToDisplay[2]["param_date"]}
                                                    param_data={graphToDisplay[2]["param_data"]}
                                                    data_border={graphToDisplay[2]["data_border"]}
                                                    data_bg={graphToDisplay[2]["data_bg"]}
                                                    sma_border={graphToDisplay[2]["sma_border"]}
                                                    sma_bg={graphToDisplay[2]["sma_bg"]}
                                                    big={true}
                                                />
                                            </div>
                                            <div style={{display: valueTabs === 3 ? 'block' : 'none'}}>
                                                <TestGraphCard_Mul
                                                    name={graphToDisplay[3]["name"]}
                                                    graphnames={graphToDisplay[3]["graphnames"]}
                                                    sub_text={graphToDisplay[3]["sub_text"]}
                                                    data={graphToDisplay[3]["data"]}
                                                    startDate={graphToDisplay[3]["startDate"]}
                                                    endDate={graphToDisplay[3]["endDate"]}
                                                    param_date={graphToDisplay[3]["param_date"]}
                                                    param_data={graphToDisplay[3]["param_data"]}
                                                    data_border={graphToDisplay[3]["data_border"]}
                                                    data_bg={graphToDisplay[3]["data_bg"]}
                                                    sma_border={graphToDisplay[3]["sma_border"]}
                                                    sma_bg={graphToDisplay[3]["sma_bg"]}
                                                    big={true}
                                                />
                                            </div>
                                            <div style={{display: valueTabs === 4 ? 'block' : 'none'}}>
                                                <TestGraphCard_Mul
                                                    name={graphToDisplay[4]["name"]}
                                                    graphnames={graphToDisplay[3]["graphnames"]}
                                                    sub_text={graphToDisplay[4]["sub_text"]}
                                                    data={graphToDisplay[4]["data"]}
                                                    startDate={graphToDisplay[4]["startDate"]}
                                                    endDate={graphToDisplay[4]["endDate"]}
                                                    param_date={graphToDisplay[4]["param_date"]}
                                                    param_data={graphToDisplay[4]["param_data"]}
                                                    data_border={graphToDisplay[4]["data_border"]}
                                                    data_bg={graphToDisplay[4]["data_bg"]}
                                                    sma_border={graphToDisplay[4]["sma_border"]}
                                                    sma_bg={graphToDisplay[4]["sma_bg"]}
                                                    big={true}
                                                />
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Row>
                    }
                </Container>
            </Row>
            <br/>
            <Row className="mt-3">
                <Col lg="6" sm="6">
                    {
                        fetchingActiveUsers ? <Spinner animation="border" role="status"/> :
                            <TestTableCard
                                name={'Active Users'}
                                sub_text={'Active arbitrary users in given period, the ones that made a purchase in the given period.'}
                                originalData={activeUsers}
                                startDate={startDate}
                                paramK={null}
                                endDate={endDate}
                                columns={columnActiveUsers}
                                url={`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/active_users`}
                                param={'active_users'}
                            />
                    }
                </Col>
                <Col lg="6" sm="6">
                    {
                        fetchingTopkItems ? <Spinner animation="border" role="status"/> :
                            <TestTableCard
                                name={'Top-k Bought Items'}
                                sub_text={'Top-k bought items by arbitrary users in given period.'}
                                originalData={topkItems}
                                startDate={startDate}
                                paramK={20}
                                endDate={endDate}
                                columns={columnTopkItems}
                                url={`${encodeURIComponent(dataset_name)}/tests/${encodeURIComponent(test_id)}/k_items`}
                                param={'topk_items'}
                            />
                    }
                </Col>
            </Row>

        </Container>
    )
}

export default TestRender;