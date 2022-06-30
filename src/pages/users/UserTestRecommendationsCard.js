// React
import React, {useRef, useState} from 'react';
// Stuff
import {CardComponent, Table} from '../../components/index';
import Spinner from "react-bootstrap/Spinner";
import TextField from "@material-ui/core/TextField";
import axios from "axios";
import UserForm from "./UserForm";
import '../../components/card/UserCard.css'
import {Button} from "@material-ui/core";
import {renderParams} from "../../utils/renderParams";
import {useNavigate} from "react-router-dom";

const UserTestRecommendationsCard = ({
                                         dataset_name, user_id, test_id, test_start, test_end,
                                         defaultAlgorithm, algorithms, columns, data
                                     }) => {
    // Selected algorithm to query recommendations from
    const [algorithm, setAlgorithm] = useState(defaultAlgorithm['algorithm_id']);
    // Indicates whether new recommendations are being fetched
    const [fetching, setFetching] = useState(false);
    // Holds the old recommendations
    const [recommendations, setRecommendations] = useState(data);
    // Holds the current recommendations being displayed
    const [currentRecommendations, setCurrentRecommendations] = useState(data);

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

    const navigate = useNavigate();

    // Fetch recommendations depending on the algorithm_id, start_date, end_date, ...
    const fetch_recommendations = (algorithm_id, from, end) => {
        setFetching(true);
        const start_date = Number.isNaN(Date.parse(from)) ? test_start : from;
        const end_date = Number.isNaN(Date.parse(end)) ? test_end : end;
        axios
            .get(`users/${encodeURIComponent(dataset_name)}/${encodeURIComponent(user_id)}/recommendations?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&k=${encodeURIComponent(readTextFieldValueK())}&algorithm=${encodeURIComponent(algorithm_id)}&test_id=${encodeURIComponent(test_id)}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                }
            )
            .then(res => {
                if (res.status === 200) {
                    setRecommendations(res['data']['recommendations']);
                    setCurrentRecommendations(res['data']['recommendations']);
                    setFetching(false);
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                navigate('/dashboard');
            })
    }
    // Update data when value of param k is changed
    const onParamKSelected = () => {
        // Fetch if new K param value is larger then current
        setFetching(true);
        fetch_recommendations(algorithm);
    }

    const [hideParams, setHideParams] = useState(true);

    const getParameters = (algo) => {
        let return_value = null;
        algorithms.forEach((item) => {
            if (item['algorithm_id'] === parseInt(algo)) {
                return_value = item;
            }
        })
        return return_value;
    }

    return (
        <CardComponent
            title='Top-k Recommendations'
            link=''
            text={
                <div>
                    <UserForm
                        name='Algorithm'
                        default_val={defaultAlgorithm['algorithm_id']}
                        data={algorithms}
                        param_value='algorithm_id'
                        param_data='name'
                        onSelect={(val) => {
                            setAlgorithm(val);
                            fetch_recommendations(val);
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={() => setHideParams(!hideParams)}
                    >
                        parameters
                    </Button>
                    {
                        hideParams ? null
                            :
                            renderParams(getParameters(algorithm))
                    }
                </div>

            }
            content={
                fetching ? <Spinner animation="border" role="status"/>
                    :
                    <Table
                        columns={columns}
                        data={currentRecommendations}
                    />
            }
            rest={
                <div>
                    <form noValidate>
                        <TextField
                            style={{marginRight: 5}}
                            id="date"
                            label="StartDate"
                            type="date"
                            inputRef={textFieldRefStart}
                            onChange={() => fetch_recommendations(algorithm)}
                            defaultValue={test_start}
                            InputProps={{
                                inputProps: {
                                    max: test_end,
                                    min: test_start
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
                            onChange={() => fetch_recommendations(algorithm)}
                            defaultValue={test_end}
                            InputProps={{
                                inputProps: {
                                    max: test_end,
                                    min: test_start
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
                            onChange={onParamKSelected}
                            defaultValue={10}
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
        />
    )
}

export default UserTestRecommendationsCard;