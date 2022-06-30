import React, {useEffect, useState} from "react";
import './Statestieken.css';
import './Graph_BAR'
import {Item_and_user_graph} from "./Graph_BAR";
import {Purchases_per_day_graph, Spend_per_day_graph} from "./Graph_LINE";
import {Card} from "react-bootstrap";
import {Slider} from '@material-ui/core'
import Spinner from "react-bootstrap/Spinner";
import axios from "axios";


function DatasetStatistics({datasetName}) {

    const [usersCount, setUsersCount] = useState(0);
    const [itemsCount, setItemsCount] = useState(0);
    const [maxDisplay, setMaxDisplay] = useState(0);
    const [spendPerDay, setSpendPerDay] = useState([]);
    const [purchasePerDay, setPurchasePerDay] = useState([]);
    const [days, setDays] = useState([]);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(20);
    const [value, setValue] = useState([from, to]);

    const [response, setResponse] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (fetching)
            return;
        setFetching(true);
        axios.get(`${datasetName}/overview/statistics`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token"),
            }
        })
            .then((result) => {
                setResponse(result.data);
            }).catch((error) => {
            setError(error);
        }).finally(() => {
            setFetching(false);
        })
    }, [])

    useEffect(() => {
        if (response !== null) {
            setUsersCount(response['users_count']);
            setItemsCount(response['items_count']);
            setSpendPerDay(response['spend_per_day']);
            setPurchasePerDay(response['bought_per_day']);
            setMaxDisplay(response['spend_per_day'].length - 1);
            setTo(response['spend_per_day'].length - 1);
            setValue([0, response['spend_per_day'].length - 1]);
            setDays(response['spend_per_day'].map(data => new Date(data['purchase_date']).toISOString().split('T')[0]));
        }
    }, [response]);

    const updaterange = (e, data) => {
        setValue(data)
        setFrom(data[0])
        setTo(data[1])
    }

    return (
        <div>
            <Card className="text-center">
                <Card.Body>
                    <Card.Title>Dataset information</Card.Title>
                </Card.Body>
            </Card>
            {usersCount > 0 && itemsCount > 0 ?
                <Card className="text-center">
                    <Card.Body>
                        {fetching ?
                            <Spinner animation="border" role="status"/>
                            :
                            <div style={{maxWidth: 400, margin: "auto"}}>
                                <Item_and_user_graph chartData1={itemsCount} chartData2={usersCount}
                                                     name={datasetName}/>
                            </div>
                        }
                    </Card.Body>
                </Card> : <></>}
            <Card className="text-center">
                <Card.Body>
                    {fetching ?
                        <Spinner animation="border" role="status"/>
                        :
                        <div style={{maxWidth: 700, margin: "auto"}}>
                            <Spend_per_day_graph data_={spendPerDay} range={value}/>
                        </div>
                    }
                </Card.Body>
            </Card>
            <Card className="text-center">
                <Card.Body>
                    {fetching ?
                        <Spinner animation="border" role="status"/>
                        :
                        <div style={{maxWidth: 700, margin: "auto"}}>
                            <Purchases_per_day_graph data_={purchasePerDay} range={value}/>
                        </div>
                    }
                </Card.Body>
            </Card>
            <Card className="text-center" style={{paddingLeft: 20, paddingRight: 20}}>
                <Card.Text> {days[from]} to {days[to]}</Card.Text>
                <Slider
                    style={{maxWidth: 700, margin: "auto"}}
                    value={value}
                    onChange={updaterange}
                    min={0}
                    max={maxDisplay}
                />
            </Card>
            <br/>
        </div>
    );
}


export default DatasetStatistics;