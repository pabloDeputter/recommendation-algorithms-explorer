// React
import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
// Bootstrap
import {Col, Container, Row} from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
// Stuff
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import {CardComponentBox, ItemCard} from '../../components/index';
import axios from "axios";
import {TestGraphCard} from "../testRender/TestGraphCard";
import {ItemColumns} from "./ItemColumns";
import OneAlgorithmRecommendations from "./OneAlgorithmRecommendations";
import {ItemPurchasesCard} from "./ItemPurchasesCard";
import MultipleAlgorithmRecommendations from "./MultipleAlgorithmRecommendations";

const ItemTestPage = () => {
    // Get params from URI
    const {dataset_name, test_id, item_id} = useParams();

    // Contains general graph and table data
    const [data, setData] = useState(null);
    // True if data is still fetching
    const [fetchingData, setFetchingData] = useState(true);
    // Current index / value of Tabs component
    const [valueTabs, setValueTabs] = useState(-1);

    // Start date of test
    const [startTest, setStartTest] = useState(null);
    // End date of test
    const [endTest, setEndTest] = useState(null);

    // Indicates if metadata is being fetched
    const [fetchingMetadata, setFetchingMetadata] = useState(true);
    // Holds metadata of item
    const [metadata, setMetadata] = useState([]);

    // Indicates if algorithms are being fetched
    const [fetchingAlgorithms, setFetchingAlgorithms] = useState(true);
    // Holds the algorithms that were used in the test
    const [algorithms, setAlgorithms] = useState(null);

    // Recommendations data
    const [recommendations, setRecommendations] = useState(null);
    const [fetchingRecommendations, setFetchingRecommendations] = useState(true);

    const {columnPurchases} = ItemColumns(dataset_name, test_id);

    const navigate = useNavigate();
    // Fetch data that will be shown when the page is loaded
    useEffect(async () => {
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
                    fetch_metadata();
                    const step_size = res['data']['data']['list'][0]['step_size'];
                    const startTestTemp = res['data']['data']['list'][0]['begin'];
                    const endTestTemp = res['data']['data']['list'][0]['end'];
                    setStartTest(startTestTemp);
                    setEndTest(endTestTemp);
                    // Fetch data that doesn't require information about algorithms
                    fetch_info(startTestTemp, endTestTemp);
                    axios
                        // Fetch algorithms used by Test, wait until you know the start and end date of Test
                        .get(`/tests/${encodeURIComponent(dataset_name)}/${encodeURIComponent(test_id)}/algorithms`)
                        .then((res) => {
                            let algos = (res['data']['algorithms']);
                            setAlgorithms(res['data']['algorithms']);
                            // Fetch recommendations
                            fetch_recommendations(startTestTemp, endTestTemp, step_size, algos);
                        });
                    setFetchingAlgorithms(false);
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

    // Fetch info for current item including data for graphs, tables, ... in interval of test
    const fetch_info = (start_date, end_date) => {
        axios
            .get(`items/${encodeURIComponent(dataset_name)}/${encodeURIComponent(item_id)}/info?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setData(res['data']);
                    setFetchingData(false);
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    // Fetch metadata for current item
    const fetch_metadata = () => {
        axios
            .get(`/item_metadata?dataset_name=${encodeURIComponent(dataset_name)}&id=${encodeURIComponent(item_id)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then((res) => {
                if (res.status === 200) {
                    setMetadata(JSON.parse(res['data']['data']['list'][0]['item_metadata']));
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

    // Fetch recommendations data
    const fetch_recommendations = async (start_date, end_date, step_size, algos) => {
        let temps = [];
        for (let i = 0; i < algos.length; i++) {
            const item = algos[i];
            const temp = {};
            axios
                .get(`items/${encodeURIComponent(dataset_name)}/${encodeURIComponent(item_id)}/recommendations?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&test_id=${encodeURIComponent(test_id)}&algorithm_id=${encodeURIComponent(item['algorithm_id'])}&step_size=${encodeURIComponent(step_size)}`,
                    {headers: {Authorization: "Bearer " + localStorage.getItem("token"),}})
                .then((res) => {
                    temps.push({
                        info: item,
                        recommendations: res['data']['recommendations'],
                        successful_recommendations: res['data']['successful_recommendations'],
                        color: getColor()
                    });
                })
                .catch((error) => {
                    navigate('/dashboard');
                })
        }
        setRecommendations(temps);
        setFetchingRecommendations(false);
    }

    const getColor = () => {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }

    return (
        <Container fluid className="justify-content-between align-content-between mt-0 mt-lg-4">
            <Row>
                <Col lg="12" m="4">
                    {
                        fetchingMetadata ? <Spinner animation="border" role="status"/>
                            :
                            <ItemCard
                                item_id={item_id}
                                data={metadata}
                                dataset_name={dataset_name}
                                test_id={test_id}
                            />
                    }
                </Col>
            </Row>
            <Row className="mt-4">
                <Col lg="5" m="4" className="mt-4 mt-lg-0">
                    {
                        fetchingData ? <Spinner animation="border" role="status"/>
                            :
                            <ItemPurchasesCard
                                name='Purchases'
                                sub_text={`This table shows all the users who bought item ${item_id} along with the price and purchase date. The standard period selected is the start and end of the test, all the data can be found on the main page of the Item.`}
                                originalData={data['purchases']['purchases_table']}
                                startDate={startTest}
                                endDate={endTest}
                                columns={columnPurchases}
                                param_date={'purchase_date'}
                            />
                    }
                </Col>
                {
                    fetchingRecommendations ? <Spinner animation="border" role="status"/> :
                        <Col lg="7" m="4" className="mt-4 mt-lg-0">
                            {
                                fetchingData || fetchingRecommendations ? <Spinner animation="border" role="status"/>
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
                                                aria-label="wrapped label scrollable force tabs example"
                                            >
                                                <Tab
                                                    label='Purchases'
                                                    value={-1}
                                                    wrapped
                                                />
                                                <Tab
                                                    label='Revenue'
                                                    value={-2}
                                                    wrapped
                                                />
                                                {
                                                    recommendations.map((item, index) => (
                                                        <Tab
                                                            key={index}
                                                            label={`Recommendations - ${item.info['name']} #${item.info['algorithm_id']}`}
                                                            value={index}
                                                            wrapped
                                                        />
                                                    ))
                                                }
                                            </Tabs>
                                        }
                                        content={
                                            <div>
                                                <div style={{display: valueTabs === -1 ? 'block' : 'none'}}>
                                                    <TestGraphCard
                                                        name='Purchases Per Day'
                                                        sub_text={`This graph shows the amount of purchases of item ${item_id} per day along with the Simple Moving Average.`}
                                                        data={data['purchases']['purchases_graph']}
                                                        startDate={startTest}
                                                        endDate={endTest}
                                                        param_date='purchase_date'
                                                        param_data='quantity'
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
                                                        name='Revenue Per Day'
                                                        sub_text={`This graph shows the revenue made of item ${item_id} per day along with the Simple Moving Average.`}
                                                        data={data['revenue']}
                                                        startDate={startTest}
                                                        endDate={endTest}
                                                        param_date='purchase_date'
                                                        param_data='revenue'
                                                        data_border='#5078CD'
                                                        data_bg='#2E4EAB'
                                                        sma_border='#F25C54'
                                                        sma_bg='#F25C54'
                                                        buttonText='description'
                                                        big={true}
                                                    />
                                                </div>
                                                {
                                                    fetchingRecommendations || startTest === null || endTest === null || recommendations === null
                                                        ?
                                                        null
                                                        :
                                                        recommendations.map((item, index) => (
                                                            <div key={index}
                                                                 style={{display: valueTabs === index ? 'block' : 'none'}}>
                                                                <OneAlgorithmRecommendations
                                                                    name={`Recommendation statistics for ${item.info['name']} #${item.info['algorithm_id']}`}
                                                                    sub_text={item.info}
                                                                    startDate={new Date(startTest).toISOString().split('T')[0]}
                                                                    endDate={new Date(endTest).toISOString().split('T')[0]}
                                                                    data={[item.successful_recommendations, item.recommendations]}
                                                                    labels={item.recommendations}
                                                                    sma_colors={[
                                                                        {
                                                                            borderColor: '#F25C54',
                                                                            backgroundColor: 'transparent',
                                                                        },
                                                                        {
                                                                            borderColor: '#a93f3b',
                                                                            backgroundColor: 'transparent',
                                                                        }
                                                                    ]}
                                                                    datasets={[
                                                                        {
                                                                            label: 'recommended successfully',
                                                                            stack: 'combined',
                                                                            type: 'bar',
                                                                            backgroundColor: '#50cd9b',
                                                                        },
                                                                        {
                                                                            label: 'recommended',
                                                                            stack: 'combined',
                                                                            type: 'bar',
                                                                            backgroundColor: '#5078CD',
                                                                        }
                                                                    ]}
                                                                    interaction={{
                                                                        mode: 'index'
                                                                    }}
                                                                    param_date='day'
                                                                    param_data='quantity'
                                                                    buttonText='parameters'
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
                }
            </Row>
            {
                fetchingRecommendations ? <Spinner animation="border" role="status"/> :
                    <Row className="mt-4">
                        <Col lg="6" m="4" className="mt-4 mt-lg-0">
                            {
                                fetchingRecommendations || startTest === null || endTest === null || recommendations === null || recommendations[0] === undefined
                                    ? null
                                    :
                                    <MultipleAlgorithmRecommendations
                                        name='Times recommended'
                                        sub_text={`This graph shows how item ${item_id} was recommended by the different algorithms used in the current selected test.`}
                                        startDate={new Date(startTest).toISOString().split('T')[0]}
                                        endDate={new Date(endTest).toISOString().split('T')[0]}
                                        data={recommendations.map((item) => item.recommendations)}
                                        labels={recommendations[0].recommendations}
                                        datasets={
                                            recommendations.map((item, index) => (
                                                {
                                                    label: `${item.info['name']} #${item.info['algorithm_id']}`,
                                                    type: 'bar',
                                                    backgroundColor: item.color
                                                }
                                            ))
                                        }
                                        interaction={{
                                            mode: 'index'
                                        }}
                                        param_date='day'
                                        param_data='quantity'
                                        buttonText='description'
                                    />
                            }
                        </Col>
                        <Col lg="6" m="4" className="mt-4 mt-lg-0">
                            {
                                fetchingRecommendations || startTest === null || endTest === null || recommendations === null || recommendations[0] === undefined ?
                                    null
                                    :
                                    <MultipleAlgorithmRecommendations
                                        name='Times recommended successfully'
                                        sub_text={`This graph shows how many times item ${item_id} was successfully recommended by the different algorithms. An recommendations was successful when an user also bought the item.`}
                                        startDate={new Date(startTest).toISOString().split('T')[0]}
                                        endDate={new Date(endTest).toISOString().split('T')[0]}
                                        data={recommendations.map((item) => item['successful_recommendations'])}
                                        labels={recommendations[0]['successful_recommendations']}
                                        datasets={
                                            recommendations.map((item, index) => (
                                                {
                                                    label: `${item.info['name']} #${item.info['algorithm_id']}`,
                                                    type: 'bar',
                                                    backgroundColor: item.color
                                                }
                                            ))
                                        }
                                        interaction={{
                                            mode: 'index'
                                        }}
                                        param_date='day'
                                        param_data='quantity'
                                        buttonText='description'
                                    />
                            }
                        </Col>
                    </Row>
            }
        </Container>
    )
}

export default ItemTestPage;