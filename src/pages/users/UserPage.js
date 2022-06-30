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
import UserRecommendationsCard from "./UserRecommendationsCard";
import UserForm from "./UserForm";

const UserPage = () => {
    // Get params from URI
    const {dataset_name, user_id} = useParams()

    // Contains general graph and table data
    const [data, setData] = useState(null);
    // True if data is still fetching
    const [dataFetching, setDataFetching] = useState(true);
    // Timestamp of first purchase made by user
    const [startDate, setStartDate] = useState(null);
    // Timestamp of last purchase made by user
    const [endDate, setEndDate] = useState(null);
    // Current index / value of Tabs component
    const [valueTabs, setValueTabs] = useState(-1);

    // Indicates if metadata is being fetched
    const [fetchingMetadata, setFetchingMetadata] = useState(false);
    // Holds metadata of item
    const [metadata, setMetadata] = useState([]);

    // Indicates if tests are being fetched
    const [fetchingTests, setFetchingTests] = useState(true);
    // All the executed tests for the current dataset
    const [tests, setTests] = useState(null);

    // Get columns used in tables
    const {columnPurchases, columnRecommendations} = UserColumns(dataset_name);


    const navigate = useNavigate();
    // Fetch data that will be shown when the page is loaded
    useEffect(async () => {
        await axios
            .get(`datasets_data?user_id=${encodeURIComponent(user_id)}&dataset_name=${encodeURIComponent(dataset_name)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then((res) => {
                if (res.status === 200 && res.data.data.total > 0) {
                    fetch_info();
                    fetch_metadata();
                    fetch_tests();
                } else {
                    alert('User does not exist or you are not logged in!');
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                alert('User does not exist or you are not logged in!');
                navigate('/dashboard');
            })
    }, [])

    // Fetch all tests that were executed for the current dataset
    const fetch_tests = () => {
        axios
            .get(`/datasets/${encodeURIComponent(dataset_name)}/tests`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then(res => {
                if (res.status === 200) {
                    setTests(res['data']['tests']);
                    setFetchingTests(false);
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
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
                    setDataFetching(false);
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }

    // Holds the current selected test for showing the CTR
    const [selectTest, setSelectTest] = useState(null);
    const [fetchingCTR, setFetchingCTR] = useState(false);
    const [selectCTR, setSelectCTR] = useState(null);
    // Executed whenever a test is selected
    const onSelectTest = (event) => {
        setFetchingCTR(true);
        setSelectTest(null);
        setSelectCTR(null);
        let temp_test = null;
        tests.forEach((item) => {
            if (item['id'] === parseInt(event)) {
                temp_test = item;
                setSelectTest(item);
            }
        })
        fetch_ctr(new Date(temp_test['begin']).toISOString().split('T')[0],
            new Date(temp_test['end']).toISOString().split('T')[0], temp_test['id'], temp_test['algorithms'])
    }
    // Fetch ctr
    const fetch_ctr = async (start_date, end_date, test_id, algos) => {
        let temp_ctr = [];
        for (let i = 0; i < algos.length; i++) {
            const item = algos[i];
            axios
                .get(`/tests/${encodeURIComponent(test_id)}/ctr/${encodeURIComponent(item['algorithm_id'])}?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&user_id=${encodeURIComponent(user_id)}`,
                    {
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("token"),
                        }
                    }
                )
                .then(res => {
                    if (res.status === 200) {
                        temp_ctr.push({
                            'info': algos[i],
                            'ctr': res['data']['ctr']
                        })

                    } else {

                        navigate('/dashboard');
                    }
                })
                .catch((error) => {
                    navigate('/dashboard');
                })
        }
        setFetchingCTR(false);
        setSelectCTR(temp_ctr);
    }

    return (
        <Container fluid className="justify-content-between align-content-between mt-0 mt-lg-4">
            <Row>
                <Col lg="4" m="4">
                    {
                        fetchingMetadata || fetchingTests ? <Spinner animation="border" role="status"/>
                            :
                            <UserCard
                                dataset_name={dataset_name}
                                user_id={user_id}
                                data={metadata}
                                test_select={
                                    <UserForm
                                        name='Test'
                                        default_val={null}
                                        data={tests}
                                        param_value='id'
                                        param_data='id'
                                        onSelect={(event) => onSelectTest(event)}
                                    />
                                }
                            />
                    }
                </Col>
                <Col lg="8" m="4" className="mt-4 mt-lg-0">
                    {
                        dataFetching ? <Spinner animation="border" role="status"/>
                            :
                            <CardComponentBox
                                title={
                                    <div>
                                        {
                                            selectTest === null
                                                ?
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
                                                    aria-label="scrollable force tabs example"
                                                >
                                                    <Tab
                                                        label='Bought Per Day'
                                                        value={-1}
                                                    />
                                                    <Tab
                                                        label='Spent Per Day'
                                                        value={-2}
                                                    />
                                                </Tabs>
                                                :
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
                                                    aria-label="scrollable force tabs example"
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
                                                        selectTest['algorithms'].map((item, index) => (
                                                            <Tab
                                                                key={index}
                                                                label={`CTR - ${item['name']}  #${item['algorithm_id']}`}
                                                                value={item['algorithm_id']}
                                                            />)
                                                        )
                                                    }
                                                </Tabs>
                                        }
                                    </div>
                                }
                                content={
                                    <div>
                                        <div style={{display: valueTabs === -1 ? 'block' : 'none'}}>
                                            <TestGraphCard
                                                name='Bought Per Day'
                                                sub_text={`This graph shows the total amount of items bought by user ${user_id} in the selected period. The standard period is the first and last purchase of the user.`}
                                                data={data['bought_per_day']}
                                                startDate={startDate}
                                                endDate={endDate}
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
                                                sub_text={`This graph shows the expenses of ${user_id} in the selected period.`}
                                                data={data['spent_per_day']}
                                                startDate={startDate}
                                                endDate={endDate}
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
                                            selectTest === null || selectCTR === null || fetchingCTR ? null
                                                :
                                                selectCTR.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        style={{display: valueTabs === item['info']['algorithm_id'] ? 'block' : 'none'}}
                                                    >
                                                        {
                                                            fetchingCTR || item['ctr'] === undefined ?
                                                                <Spinner animation="border" role="status"/>
                                                                :
                                                                <TestGraphCard
                                                                    name={`CTR - ${item['info']['name']}  #${item['info']['algorithm_id']}`}
                                                                    sub_text={item['info']}
                                                                    data={item['ctr']}
                                                                    startDate={new Date(selectTest['begin']).toISOString().split('T')[0]}
                                                                    endDate={new Date(selectTest['begin']).toISOString().split('T')[0]}
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
                                                        }
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
                        dataFetching ? <Spinner animation="border" role="status"/>
                            :
                            <UserPurchasesCard
                                name='Purchases'
                                sub_text={`All the purchases of user ${user_id} for the selected period are shown in this table. The default period selected is the first and last purchase made by the user.`}
                                originalData={data['purchases']}
                                startDate={startDate}
                                endDate={endDate}
                                columns={columnPurchases}
                                param_date='purchase_date'
                            />
                    }
                </Col>
                <Col lg="6" m="4" className="mt-4 mt-lg-0">
                    {
                        fetchingTests ? <Spinner animation="border" role="status"/>
                            :
                            <UserRecommendationsCard
                                dataset_name={dataset_name}
                                user_id={user_id}
                                data={tests}
                            />
                    }
                </Col>
            </Row>
        </Container>
    )
}

export default UserPage;