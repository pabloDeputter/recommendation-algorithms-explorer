// React
import React, {useEffect, useRef, useState} from 'react';
// Bootstrap
// Stuff
import {CardComponent, Table} from '../../components/index';
import {Link, useNavigate} from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import TextField from "@material-ui/core/TextField";
import axios from "axios";
import UserForm from "./UserForm";
import {Button} from "@material-ui/core";
import {renderParams} from "../../utils/renderParams";
import Form from "react-bootstrap/Form";
import {Row} from "react-bootstrap";
import Col from "react-bootstrap/Col";

const UserRecommendationsCard = ({dataset_name, user_id, data}) => {
    // Selected test to query recommendations from
    const [test, setTest] = useState(null);
    // Selected algorithm to query recommendations from
    const [algorithm, setAlgorithm] = useState(-1);
    // Default start date of test
    const [defaultStart, setDefaultStart] = useState(null);
    // Default end date of test
    const [defaultEnd, setDefaultEnd] = useState(null);
    // Default param k value
    const [defaultK, setDefaultK] = useState(10);
    const [defaultAlgorithm, setDefaultAlgorithm] = useState(null);

    // Get data depending on param for test
    const getTestData = (param) => {
        if (test !== null) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].id === parseInt(test)) {
                    return data[i][param];
                }
            }
        }
    }
    // Get date's from IntervalPicker component
    const textFieldRefStart = useRef();
    const readTextFieldValueStart = () => {
        return textFieldRefStart.current.value;
    }
    const textFieldRefEnd = useRef();
    const readTextFieldValueEnd = () => {
        return textFieldRefEnd.current.value;
    }
    // Get param k value from form component
    const textFieldRefK = useRef();
    const readTextFieldValueK = () => {
        if (textFieldRefK < 0) {
            return textFieldRefK.current.value * -1
        }
        return textFieldRefK.current.value
    }
    // Executed when a test is selected
    const onSelectTest = (value) => {
        setTest(value);
        setFetching(null);
    }
    // Set begin and start date of test
    useEffect(() => {
        if (test !== null) {
            setAlgorithm(-1);
            setDefaultStart(new Date(getTestData('begin')).toISOString().split('T')[0]);
            setDefaultEnd(new Date(getTestData('end')).toISOString().split('T')[0]);
        }
    }, [test])

    const renderAlgorithms = (test, data) => {
        if (test === null) return null
        return (
            <div>
                <Form className={"pt-3"}>
                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <Form.Select aria-label="Default select example"
                                         value={algorithm}
                                         onChange={(e) => {
                                             setAlgorithm(e.target.value);
                                             onAlgorithmSelected(e.target.value);
                                         }}
                            >
                                <option disabled value={-1}>{'Algorithm'}</option>
                                {data.map((item, index) => (
                                    <option key={index}
                                            value={parseInt(item['algorithm_id'])}>{item['name']} #{item['algorithm_id']}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Row>
                </Form>
            </div>
        )
    }

    // True if data is being fetched
    const [fetching, setFetching] = useState(null);
    // Holds the recommendations that we got from the API
    const [recommendations, setRecommendations] = useState(null);
    // Recommendations that are actually shown, for example when k is changed we don't need to a re-fetch
    const [newRecommendations, setNewRecommendations] = useState(null);

    const navigate = useNavigate('/dashboard');

    // Fetch data with val being the algorithm selected
    const fetchData = (val, from, end) => {
        if (val === null || val === -1) {
            return;
        }
        const start_date = Number.isNaN(Date.parse(from)) ? defaultStart : from;
        const end_date = Number.isNaN(Date.parse(end)) ? defaultEnd : end;

        axios
            // /api/users/<string:dataset_name>/<int:user_id>/recommendations
            .get(`users/${encodeURIComponent(dataset_name)}/${encodeURIComponent(user_id)}/recommendations?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&k=${encodeURIComponent(readTextFieldValueK())}&algorithm=${encodeURIComponent(val)}&test_id=${encodeURIComponent(test)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
            .then(res => {
                if (res.status === 200) {
                    console.log(res)
                    setRecommendations(res['data']['recommendations']);
                    setNewRecommendations(res['data']['recommendations']);
                    setFetching(false);
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }
    // // Update data when algorithm is selected
    const onAlgorithmSelected = (val) => {
        setAlgorithm(val);
        setFetching(true);
        fetchData(val, readTextFieldValueStart(), readTextFieldValueEnd());
    }
    // Update data when value of param k is changed
    const onParamKSelected = () => {
        // Fetch if new K param value is larger then current
        setFetching(true);
        fetchData(algorithm, readTextFieldValueStart(), readTextFieldValueEnd());
    }
    // Update data when interval has changed
    const onIntervalSelected = () => {
        setFetching(true);
        fetchData(algorithm, readTextFieldValueStart(), readTextFieldValueEnd());
    }

    const [hideParams, setHideParams] = useState(true);
    const getParameters = (test_id, algo) => {
        let return_value = null;
        data.forEach((item) => {
            if (item['id'] === parseInt(test_id)) {
                item['algorithms'].forEach((a) => {
                    if (a['algorithm_id'] === parseInt(algo)) {
                        return_value = a;
                    }
                })
            }
        })
        return return_value;
    }

    // Render recommendations content
    const renderContent = () => {
        if (fetching === null) {
            return (<div/>);
        }
        if (fetching) {
            return (<Spinner animation="border" role="status"/>);
        } else {
            return (
                <Table
                    columns={[
                        {
                            name: 'rank',
                            selector: row => row.rank,
                            sortable: true,
                        },
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
                            name: 'day',
                            selector: row => new Date(row.day).toISOString().split('T')[0],
                            sortable: true,
                        },
                    ]}
                    data={newRecommendations}
                />
            )
        }
    }

    return (
        <CardComponent
            title='Top-k Recommendations'
            link=''
            text={
                <div>
                    <UserForm
                        name='Test'
                        default_val={null}
                        data={data}
                        param_value='id'
                        param_data='id'
                        onSelect={onSelectTest}
                    />
                    {
                        test === null ? <div/> :
                            <div>
                                {renderAlgorithms(test, getTestData('algorithms'))}
                            </div>
                    }
                    {
                        algorithm === null || algorithm === -1 ? null
                            :
                            <div>
                                <Button
                                    variant="contained"
                                    onClick={() => setHideParams(!hideParams)}
                                >
                                    parameters
                                </Button>
                                {
                                    hideParams ? null
                                        :
                                        renderParams(getParameters(test, algorithm))
                                }
                            </div>
                    }
                </div>
            }
            content={
                renderContent()
            }
            rest={
                <div>
                    {
                        test === null ? <div/> :
                            <div>
                                <form noValidate>
                                    <TextField
                                        style={{marginRight: 5}}
                                        id="date"
                                        label="StartDate"
                                        type="date"
                                        inputRef={textFieldRefStart}
                                        onInput={onIntervalSelected}
                                        defaultValue={defaultStart}
                                        InputProps={{
                                            inputProps: {
                                                max: defaultEnd,
                                                min: defaultStart
                                            }
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                    <TextField
                                        style={{marginRight: 5}}
                                        id="date"
                                        label="EndDate"
                                        type="date"
                                        inputRef={textFieldRefEnd}
                                        onInput={onIntervalSelected}
                                        defaultValue={defaultEnd}
                                        InputProps={{
                                            inputProps: {
                                                max: defaultEnd,
                                                min: defaultStart
                                            }
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                    <TextField
                                        id="number"
                                        label="K"
                                        type="number"
                                        inputRef={textFieldRefK}
                                        onInput={onParamKSelected}
                                        defaultValue={defaultK}
                                        InputProps={{
                                            inputProps: {
                                                max: 100,
                                                min: 0
                                            }
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                </form>
                            </div>
                    }
                </div>
            }
        />
    )
}

export default UserRecommendationsCard;