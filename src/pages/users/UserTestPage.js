// React
import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
// Bootstrap
import {Col, Container, Row} from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
// Stuff
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import {CardComponentBox, UserCard} from '../../components/index';
import axios from "axios";
import {TestGraphCard} from "../testRender/TestGraphCard";
import {UserPurchasesCard} from "./UserPurchasesCard";
import {UserColumns} from "./UserColumns";
import UserTestRecommendationsCard from "./UserTestRecommendationsCard";
import '../../components/card/UserCard.css'


const UserPage = () => {
    // Get params from URI
    const {dataset_name, test_id, user_id} = useParams()

    // Contains general graph and table data
    const [data, setData] = useState(null);
    // True if data is still fetching
    const [fetchingData, setFetchingData] = useState(true);
    // Timestamp of first purchase made by user
    const [startDate, setStartDate] = useState(null);
    // Timestamp of last purchase made by user
    const [endDate, setEndDate] = useState(null);
    // Current index / value of Tabs component
    const [valueTabs, setValueTabs] = useState(-1);
    // Current index / value of Tabs CTR component
    const [valueTabsCTR, setValueTabsCTR] = useState(0);
    // Start date of test
    const [startTest, setStartTest] = useState(null);
    // End date of test
    const [endTest, setEndTest] = useState(null);
    // Algorithms of test
    const [algorithms, setAlgorithms] = useState(null);

    // Indicates if metadata is being fetched
    const [fetchingMetadata, setFetchingMetadata] = useState(true);
    // Holds metadata of item
    const [metadata, setMetadata] = useState([]);

    // Indicates if recommendations are being fetched
    const [fetchingRecommendations, setFetchingRecommendations] = useState(true);
    // Holds the recommendations for the current selected algorithm
    const [recommendations, setRecommendations] = useState(null);

    // Indicates whether CTR is being fetched
    const [fetchingCTR, setFetchingCTR] = useState(true);
    const [CTR, setCTR] = useState(null);

    // Get columns used in tables
    const {columnPurchases, columnRecommendations} = UserColumns(dataset_name, test_id);

    const navigate = useNavigate();

    // Fetch data that will be shown when the page is loaded
    useEffect(async () => {
        let startTestTemp = null;
        let endTestTemp = null
        await axios
            // Fetch test start and end dates of the Test
            .get(`/tests?id=${encodeURIComponent(test_id)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then((res) => {
                if (res.status === 200 && res.data.data.total > 0) {
                    axios
                        .get(`datasets_data?user_id=${encodeURIComponent(user_id)}&dataset_name=${encodeURIComponent(dataset_name)}`,
                            {
                                headers: {
                                    Authorization: "Bearer " + localStorage.getItem("token"),
                                }
                            })
                        .then((res) => {
                            if (res.status !== 200 || res.data.data.total <= 0) {
                                alert('User does not exist or you are not logged in!')
                                navigate('/dashboard');
                            }
                        })
                        .catch((error) => {
                            alert('User does not exist or you are not logged in!');
                            navigate('/dashboard');
                        })
                    startTestTemp = res['data']['data']['list'][0]['begin'];
                    endTestTemp = res['data']['data']['list'][0]['end'];
                    setStartTest(new Date(res['data']['data']['list'][0]['begin']).toISOString().split('T')[0]);
                    setEndTest(new Date(res['data']['data']['list'][0]['end']).toISOString().split('T')[0]);
                    axios
                        // Fetch algorithms used by Test, wait until you know the start and end date of Test
                        .get(`/tests/${encodeURIComponent(dataset_name)}/${encodeURIComponent(test_id)}/algorithms`)
                        .then((res) => {
                            let algos = (res['data']['algorithms']);
                            setAlgorithms(res['data']['algorithms']);
                            // Fetch CTR for each algorithm
                            fetch_ctr(startTestTemp, endTestTemp, algos);
                            // Fetch recommendations
                            fetch_recommendations(startTestTemp, endTestTemp, algos[0]['algorithm_id'], 10);
                        });
                    // Fetch info
                    fetch_info();
                    // fetch metadata
                    fetch_metadata();
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                alert('Test does not exist or you are not logged in!')
                navigate('/dashboard');
            })
    }, [])

    const calculate_data = (raw_data, param_date, from, to) => {
        return raw_data.filter((marker) => {
            const purchase_date = new Date(marker[param_date]).toISOString().split('T')[0];
            return (purchase_date >= from && purchase_date <= to)
        })
    }

    // Fetch metadata for the current user
    const fetch_metadata = () => {
        axios
            .get(`/user_metadata?dataset_name=${encodeURIComponent(dataset_name)}&id=${encodeURIComponent(user_id)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                }
            )
            .then((res) => {
                if (res.status === 200) {
                    setMetadata(JSON.parse(res['data']['data']['list'][0]['user_metadata']));
                    setFetchingMetadata(false);
                } else {
                    setMetadata([]);
                    setFetchingMetadata(false);
                }
            })
            .catch((error) => {
                setMetadata([]);
                setFetchingMetadata(false);
            })
    }
    // Get general info of user such as purchases, spent per day, ...
    const fetch_info = () => {
        axios
            .get(`/users/${encodeURIComponent(dataset_name)}/${encodeURIComponent(user_id)}/info`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then(res => {
                if (res.status === 200) {
                    setData(res['data']);
                    setStartDate(new Date(res['data']['interval'][0]['start_date']).toISOString().split('T')[0]);
                    setEndDate(new Date(res['data']['interval'][0]['end_date']).toISOString().split('T')[0]);
                    setFetchingData(false);
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }
    // Fetch recommendations
    const fetch_recommendations = (start_date, end_date, algorithm_id, param_k) => {
        axios
            .get(`users/${encodeURIComponent(dataset_name)}/${encodeURIComponent(user_id)}/recommendations?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&k=${encodeURIComponent(param_k)}&algorithm=${encodeURIComponent(algorithm_id)}&test_id=${encodeURIComponent(test_id)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then(res => {
                if (res.status === 200) {
                    setRecommendations(res['data']['recommendations']);
                    setFetchingRecommendations(false);
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }
    // Fetch CTR
    const fetch_ctr = async (start_date, end_date, algos) => {
        let temp_ctr = [];
        for (let i = 0; i < algos.length; i++) {
            const item = algos[i];
            const promise = await axios
                .get(`/tests/${encodeURIComponent(test_id)}/ctr/${encodeURIComponent(item['algorithm_id'])}?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&user_id=${encodeURIComponent(user_id)}`,
                    {
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("token"),
                        }
                    })
                .then(res => {
                    if (res.status === 200) {
                        return {
                            'info': item,
                            'ctr': res['data']['ctr'],
                        };
                    } else {
                        navigate('/dashboard');
                    }
                })
                .catch((error) => {
                    navigate('/dashboard');
                })
            temp_ctr.push(promise);
        }
        setCTR(temp_ctr);
        setFetchingCTR(false);
    }

    return (
        <Container fluid className="justify-content-between align-content-between mt-0 mt-lg-4">
            <Row>
                <Col lg="4" m="4">
                    {
                        fetchingMetadata ? <Spinner animation="border" role="status"/>
                            :
                            <UserCard
                                dataset_name={dataset_name}
                                user_id={user_id}
                                data={metadata}
                                test_id={test_id}
                            />
                    }
                </Col>
                <Col lg="8" m="4" className="mt-4 mt-lg-0">
                    {
                        fetchingData || data === null || fetchingCTR || startTest === null || endTest === null ?
                            <Spinner animation="border" role="status"/>
                            :
                            <CardComponentBox
                                title={
                                    <Tabs
                                        value={valueTabs}
                                        onChange={(event, value) => setValueTabs(value)}
                                        textColor='inherit'
                                        TabIndicatorProps={{
                                            style: {
                                                backgroundColor: "#5078CD"
                                            }
                                        }}
                                        variant="scrollable"
                                        scrollButtons="auto"
                                        aria-label="scrollable force tabs"
                                    >
                                        <Tab
                                            label='Bought Per Day'
                                            value={-1}
                                        />
                                        <Tab
                                            label='Spent Per Day'
                                            value={-2}
                                        />
                                        {
                                            CTR.map((item, index) => (
                                                <Tab
                                                    key={index}
                                                    label={`CTR - ${item['info']['name']}  #${item['info']['algorithm_id']}`}
                                                    value={item['info']['algorithm_id']}
                                                />)
                                            )
                                        }
                                    </Tabs>
                                }
                                text=''
                                content={
                                    <div>
                                        <div style={{display: valueTabs === -1 ? 'block' : 'none'}}>
                                            <TestGraphCard
                                                name='Bought Per Day'
                                                sub_text={`This graph shows the total amount of items bought by user ${user_id} in the selected period. The current graph only shows the data for the period in which the test was run, but all the data can be seen on the main User Page.`}
                                                data={calculate_data(data['bought_per_day'], 'purchase_date', startTest, endTest)}
                                                startDate={startTest}
                                                endDate={endTest}
                                                param_date='purchase_date'
                                                param_data='bought'
                                                data_border='#5078CD'
                                                data_bg='#2E4EAB'
                                                sma_border='#F25C54'
                                                sma_bg='#F25C54'
                                                buttonText='description'
                                                big={true}
                                            />
                                        </div>
                                        <div style={{display: valueTabs === -2 ? 'block' : 'none'}}>
                                            <TestGraphCard
                                                name='Spent Per Day'
                                                sub_text={`This graph shows the expenses of ${user_id} in the selected period. Once again all the data can be found on the main User page.`}
                                                data={calculate_data(data['spent_per_day'], 'purchase_date', startTest, endTest)}
                                                startDate={startTest}
                                                endDate={endTest}
                                                param_date='purchase_date'
                                                param_data='spent'
                                                data_border='#5078CD'
                                                data_bg='#2E4EAB'
                                                sma_border='#F25C54'
                                                sma_bg='#F25C54'
                                                buttonText='description'
                                                big={true}
                                            />
                                        </div>
                                        {
                                            CTR.map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{display: valueTabs === item['info']['algorithm_id'] ? 'block' : 'none'}}
                                                >
                                                    <TestGraphCard
                                                        name={`CTR - ${item['info']['name']}  #${item['info']['algorithm_id']}`}
                                                        sub_text={item['info']}
                                                        data={item['ctr']}
                                                        startDate={startTest}
                                                        endDate={endTest}
                                                        param_date='purchase_date'
                                                        param_data='ctr'
                                                        data_border='#5078CD'
                                                        data_bg='#2E4EAB'
                                                        sma_border='#F25C54'
                                                        sma_bg='#F25C54'
                                                        buttonText='parameters'
                                                        big={true}
                                                        ctr={true}
                                                    />
                                                </div>
                                            ))
                                        }
                                    </div>
                                }
                            >
                            </CardComponentBox>
                    }
                </Col>
            </Row>
            <Row className="mt-4">
                <Col lg="6" m="4" className="mt-4 mt-lg-0">
                    {
                        fetchingData || startTest === null || endTest === null ?
                            <Spinner animation="border" role="status"/>
                            :
                            <UserPurchasesCard
                                name='Purchases'
                                sub_text={`All the purchases of user ${user_id} for the given period are shown in this table. The standard period is the start and end of the current Test.`}
                                originalData={calculate_data(data['purchases'], 'purchase_date', startTest, endTest)}
                                startDate={startTest}
                                endDate={endTest}
                                columns={columnPurchases}
                                param_date='purchase_date'
                            />
                    }
                </Col>
                <Col lg="6" m="4" className="mt-4 mt-lg-0">
                    {
                        fetchingRecommendations || startTest === null || endTest === null ?
                            <Spinner animation="border" role="status"/>
                            :
                            <UserTestRecommendationsCard
                                dataset_name={dataset_name}
                                user_id={user_id}
                                test_id={test_id}
                                test_start={startTest}
                                test_end={endTest}
                                defaultAlgorithm={algorithms[0]}
                                algorithms={algorithms}
                                columns={columnRecommendations}
                                data={recommendations}
                            />
                    }
                </Col>
            </Row>
        </Container>
    )
}

export default UserPage;