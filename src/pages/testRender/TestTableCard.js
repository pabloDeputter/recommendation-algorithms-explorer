// React
import React, {useRef, useState} from 'react';
// Stuff
import {CardComponent, Table} from '../../components';
import '../../components/card/UserCard.css'
import TextField from "@material-ui/core/TextField";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import {Col, Row} from "react-bootstrap";

export const TestTableCard = (props) => {
    // PROPS
    const {name, sub_text, originalData, startDate, endDate, paramK, columns, url, param} = props;
    const [defaultK, setDefaultK] = useState(paramK);
    const [defaultStart, setDefaultStart] = useState(startDate);
    const [defaultEnd, setDefaultEnd] = useState(endDate);
    // DATA
    const [currentData, setCurrentData] = useState(originalData);
    const [newData, setNewData] = useState(originalData);
    // FETCHING
    const [fetching, setFetching] = useState(false);

    // PARAMETER PICKER
    const textFieldRefK = useRef();
    const readTextFieldValueK = () => {
        if (paramK === null) {
            return 0;
        }
        if (textFieldRefK < 0) {
            return textFieldRefK.current.value * -1
        }
        return textFieldRefK.current.value
    }
    // INTERVAL PICKER
    const textFieldRefStart = useRef();
    const readTextFieldValueStart = () => {
        return textFieldRefStart.current.value;
    }
    const textFieldRefEnd = useRef();
    const readTextFieldValueEnd = () => {
        return textFieldRefEnd.current.value;
    }

    // UPDATING DATA WHEN INTERVAL IS SELECTED
    const onIntervalSelected = () => {
        // UPDATE DEFAULT VALUES
        setDefaultK(readTextFieldValueK());
        setDefaultStart(readTextFieldValueStart());
        setDefaultEnd(readTextFieldValueEnd());
        // SET FETCHING
        setFetching(true)
        // REQUEST DATA
        axios
            .get(`${url}?start_date=${readTextFieldValueStart()}&end_date=${readTextFieldValueEnd()}&k=${readTextFieldValueK()}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then(res => res.data)
            .then(data => {
                setCurrentData(data[param]);
                setNewData(data[param]);
                setFetching(false);
            })
    }
    // UPDATE DATA WHEN PARAM K IS SELECTED
    const onParamKSelected = () => {
        // Fetch if new K param value is larger then current
        if (readTextFieldValueK() > currentData.length) {
            onIntervalSelected()
        } else {
            setNewData(currentData.slice(0, readTextFieldValueK()));
        }
    }

    return (
        <div>
            <CardComponent
                title={name}
                link=''
                text={
                    <div>
                        <div style={{textAlign: 'left', maxWidth: 500, wordBreak: 'break-word'}}
                             className="user-card-metadata-key">
                            {sub_text}
                        </div>
                    </div>
                }
                content={
                    <div>
                        {
                            fetching ? <Spinner animation="border" role="status"/> :
                                <Table
                                    data={newData}
                                    columns={columns}
                                />
                        }
                    </div>
                }
                rest={
                    <div>
                        {
                            fetching ? <Spinner animation="border" role="status"/> :
                                <div>
                                    <form noValidate>
                                        <TextField
                                            id="date"
                                            label="StartDate"
                                            type="date"
                                            inputRef={textFieldRefStart}
                                            onChange={onIntervalSelected}
                                            defaultValue={defaultStart}
                                            InputProps={{
                                                inputProps: {
                                                    max: endDate,
                                                    min: startDate
                                                }
                                            }}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </form>
                                    <form noValidate>
                                        <TextField
                                            id="date"
                                            label="EndDate"
                                            type="date"
                                            inputRef={textFieldRefEnd}
                                            onChange={onIntervalSelected}
                                            defaultValue={defaultEnd}
                                            InputProps={{
                                                inputProps: {
                                                    max: endDate,
                                                    min: startDate
                                                }
                                            }}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </form>
                                    {
                                        paramK === null ? <div><br/> <br/></div> :
                                            <form noValidate>
                                                <TextField
                                                    id="number"
                                                    label="K"
                                                    type="number"
                                                    inputRef={textFieldRefK}
                                                    onChange={onParamKSelected}
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
                                    }
                                </div>
                        }
                    </div>
                }
            />
        </div>
    )
}

// Function to execute when row is expanded in table
/*
const Expanded = ({data}) => {
    return (
        <div>
            <Card>
                <Card.Body>
                    <Card.Text>
                        <Row>
                            <Col>
                                item_id = {data['item_id']}
                            </Col>
                            <Col>
                                quantity = {data['quantity']}
                            </Col>
                        </Row>
                    </Card.Text>
                </Card.Body>
            </Card>
        </div>
    )
}*/


export const TestTableCardMulRows = (props) => {
    // PROPS
    const {
        name,
        sub_text,
        originalData,
        startDate,
        endDate,
        paramK,
        columns,
        url,
        param,
        amount,
        update_param_k
    } = props;
    const [defaultK, setDefaultK] = useState(paramK);
    const [defaultStart, setDefaultStart] = useState(startDate);
    const [defaultEnd, setDefaultEnd] = useState(endDate);
    // DATA
    const [currentData, setCurrentData] = useState(originalData);
    const [newData, setNewData] = useState(originalData);
    const [amount_, setAmount_] = useState(amount);
    // FETCHING
    const [fetching, setFetching] = useState(false);

    // PARAMETER PICKER
    const textFieldRefK = useRef();
    const readTextFieldValueK = () => {
        if (paramK === null) {
            return 0;
        }
        if (textFieldRefK < 0) {
            return textFieldRefK.current.value * -1
        }
        return textFieldRefK.current.value
    }
    // INTERVAL PICKER
    const textFieldRefStart = useRef();
    const readTextFieldValueStart = () => {
        return textFieldRefStart.current.value;
    }
    const textFieldRefEnd = useRef();
    const readTextFieldValueEnd = () => {
        return textFieldRefEnd.current.value;
    }

    // UPDATING DATA WHEN INTERVAL IS SELECTED
    const onIntervalSelected = () => {
        if (readTextFieldValueStart() !== '' && readTextFieldValueEnd() !== ''){
            // UPDATE DEFAULT VALUES
            setDefaultK(readTextFieldValueK());
            setDefaultStart(readTextFieldValueStart());
            setDefaultEnd(readTextFieldValueEnd());
            // SET FETCHING
            setFetching(true)
            // REQUEST DATA
            axios
            .get(`${url}?start_date=${readTextFieldValueStart()}&end_date=${readTextFieldValueEnd()}&k=${readTextFieldValueK()}`,
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                })
            .then(res => res.data)
            .then(data => {
                setCurrentData(data[param]);
                setNewData(data[param]);
                setFetching(false);
            })
        }
    }
    // UPDATE DATA WHEN PARAM K IS SELECTED
    const onParamKSelected = () => {
        if (update_param_k) {
            // Fetch if new K param value is larger then current
            if (readTextFieldValueK() > currentData.length) {
                onIntervalSelected()
            } else {
                let set1 = currentData.slice(0, readTextFieldValueK());
                // console.log(Number(currentData.length / 2), (Number(currentData.length / 2) + Number(readTextFieldValueK())));
                let set2 = currentData.slice(Number(currentData.length / 2), (Number(currentData.length / 2) + Number(readTextFieldValueK())));
                setNewData(set1.concat(set2));
            }
        }
        else {
            onIntervalSelected()
        }
    }

    return (
        <div>
            <CardComponent
                title={name}
                link=''
                text={
                    <div>
                        <div style={{textAlign: 'left', maxWidth: 500, wordBreak: 'break-word'}}
                             className="user-card-metadata-key">
                            {sub_text}
                        </div>
                    </div>
                }
                content={
                    <div>
                        {
                            fetching ? <Spinner animation="border" role="status"/> :

                                <Row>
                                    {amount_.map((item, index) => {
                                        //console.log(newData)
                                        var subsetNewData;
                                        subsetNewData = newData.filter(function (s) {
                                            return s.algorithm === item.name && s.id === item.id
                                        });
                                        return <Col key={index}>
                                            <p>{`${item.name} #${item.id}`}</p>
                                            <Table data={subsetNewData}
                                                   columns={columns}
                                                //expandableRows
                                                //expandableRowsComponent={Expanded}
                                            />
                                        </Col>
                                    })
                                    }

                                </Row>

                        }
                    </div>
                }
                rest={
                    <div>
                        {
                            fetching ? <Spinner animation="border" role="status"/> :
                                <div>
                                    <form noValidate>
                                        <TextField
                                            id="date"
                                            label="StartDate"
                                            type="date"
                                            inputRef={textFieldRefStart}
                                            onChange={onIntervalSelected}
                                            defaultValue={defaultStart}
                                            InputProps={{
                                                inputProps: {
                                                    max: endDate,
                                                    min: startDate
                                                }
                                            }}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </form>
                                    <form noValidate>
                                        <TextField
                                            id="date"
                                            label="EndDate"
                                            type="date"
                                            inputRef={textFieldRefEnd}
                                            onChange={onIntervalSelected}
                                            defaultValue={defaultEnd}
                                            InputProps={{
                                                inputProps: {
                                                    max: endDate,
                                                    min: startDate
                                                }
                                            }}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </form>
                                    {
                                        paramK === null ? <div/> :
                                            <form noValidate>
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
                                    }
                                </div>
                        }
                    </div>
                }
            />
        </div>
    )
}