// React
import React, {useEffect, useRef, useState} from 'react';
// Stuff
import {CardComponent, IntervalPicker} from '../../components';
import '../../components/card/UserCard.css'
import {Button, Checkbox, FormControlLabel, FormGroup, Slider} from '@material-ui/core';
import {Line} from 'react-chartjs-2';
import {renderParams} from "../../utils/renderParams";
import {PrettyNumbers} from "../../utils/PrettyNumbers";
import {sma} from "../../utils/SMA";
import {Chart as ChartJS, registerables} from "chart.js";

ChartJS.register(...registerables)


// UPDATE TOTAL DATA
const calculateTotal = (data, param_data) => {
    let total = 0;
    data.forEach(item => total += item[param_data])
    return total;
}

const OneAlgorithmRecommendations = (props) => {
    // PROPS
    const {
        name,
        sub_text,
        data,
        startDate,
        labels,
        sma_colors,
        datasets,
        endDate,
        param_date,
        param_data,
        buttonText
    } = props;

    // DATA
    const [graphData, setGraphData] = useState(data);
    const [movingAverage, setMovingAverage] = useState(data.map((item, index) => (
        sma(data[index], 1, param_date, param_data)
    )));
    const [showSMA, setShowSMA] = useState(false);
    // SLIDER
    const [sliderValue, setSliderValue] = useState(1);
    const [sliderMaxValue, setSliderMaxValue] = useState(labels.length);
    const [hideText, setHideText] = useState(true);
    // INTERVAL PICKER
    const textFieldRefStart = useRef();
    const readTextFieldValueStart = () => {
        return textFieldRefStart.current.value;
    }
    const textFieldRefEnd = useRef();
    const readTextFieldValueEnd = () => {
        return textFieldRefEnd.current.value;
    }

    // UPDATING DATA
    const onIntervalSelected = () => {
        const from = readTextFieldValueStart();
        const to = readTextFieldValueEnd();
        const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        const firstDate = new Date(from);
        const secondDate = new Date(to);
        const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
        if (diffDays < labels.length) {
            setSliderMaxValue(diffDays);
        } else {
            setSliderMaxValue(labels.length);
        }


        let new_graphdata = [];
        data.forEach((item, index) => {
            new_graphdata.push(item.filter((marker) => {
                // const purchase_date = marker[param_date]
                const purchase_date = new Date(marker[param_date]).toISOString().split('T')[0];
                return (purchase_date >= from && purchase_date <= to)
            }))
        })
        console.log(new_graphdata)
        setSliderMaxValue(new_graphdata[0].length);
        setGraphData(new_graphdata);

    }


    useEffect(() => {
        if (sliderValue > sliderMaxValue) {
            setSliderValue(sliderMaxValue);
        }
        setMovingAverage(graphData.map((item, index) => (
            sma(graphData[index], sliderValue, param_date, param_data)
        )))

    }, [sliderValue, sliderMaxValue, showSMA])


    const getDatasets = () => {
        let temps = [];
        datasets.map((item, index) => {

            let temp = structuredClone(item);
            temp.data = graphData[index].map((item) => {
                return item[param_data];
            })
            temps.push(temp);
        })

        datasets.map((item, index) => {
            if (showSMA) {
                const temp_sma = structuredClone(datasets[index]);
                const temp_sma_data = movingAverage[index].map((item) => {
                    return item[param_data];
                })
                temp_sma.label = `SMA - ${temp_sma.label}`;
                temp_sma.data = temp_sma_data;
                temp_sma.combined = 'stack'
                temp_sma.type = 'line'
                temp_sma.borderColor = sma_colors[index]['borderColor'];
                temp_sma.backgroundColor = 'transparent';
                temps.push(temp_sma);
            }
        })


        return temps;
    }

    const renderText = () => {
        if (buttonText === null || buttonText === undefined || buttonText === 'description') {
            return (
                <div style={{textAlign: 'left', maxWidth: 500, marginTop: 5, wordBreak: 'break-word'}}
                     className="user-card-metadata-key"
                >
                    {sub_text}
                </div>
            )
        }
        if (buttonText === 'parameters') {
            return (
                renderParams(sub_text)
            )
        } else {
            return null
        }
    }

    let delayed;


    return (
        <CardComponent
            title={name}
            link=''
            text={
                <div>
                    <div style={{display: 'inline'}}>
                        {
                            datasets.map((item, index) => (
                                <div
                                    key={index}
                                    className="user-card-metadata-key">
                                    {`TOTAL ${item['label']} - `}
                                    <span
                                        className="user-card-metadata-val">
                                        {PrettyNumbers(Math.round((showSMA ? calculateTotal(movingAverage[index], param_data) : calculateTotal(graphData[index], param_data) + Number.EPSILON) * 100) / 100)}
                                    </span>
                                </div>
                            ))
                        }
                    </div>
                    <div>
                        <div>
                            {
                                !showSMA ? null
                                    :
                                    <div>
                                        <div style={{textAlign: 'left'}} className="user-card-metadata-key"> SMA WINDOW
                                            SIZE : {sliderValue} </div>
                                        <Slider
                                            className="float-start m-auto flex-grow-0"
                                            value={sliderValue}
                                            onChange={(e, ee) => setSliderValue(ee)}
                                            min={1}
                                            max={sliderMaxValue}
                                        />
                                    </div>
                            }
                            {
                                buttonText === undefined ? null
                                    :
                                    <Button
                                        variant="contained"
                                        onClick={() => setHideText(!hideText)}
                                    >
                                        {hideText ? `${buttonText}` : `${buttonText}`}
                                    </Button>
                            }
                            {
                                hideText ? null
                                    :
                                    <div>
                                        {
                                            renderText()
                                        }
                                    </div>
                            }
                        </div>
                    </div>
                </div>
            }
            content={
                <Line
                    type='line'
                    style={{maxWidth: '100%'}}
                    data={{
                        labels: graphData[0].map((item) => new Date(item[param_date]).toISOString().split('T')[0]),
                        datasets: [...getDatasets()]
                    }}
                    options={{
                        fill: true,
                        maintainAspectRatio: true,
                        responsive: true,
                        interaction: {
                            mode: 'index'
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    footer: (context) => {
                                        const recomm = context[1].raw;
                                        const recomm_s = context[0].raw;
                                        return `${((recomm_s / recomm) * 100).toFixed(2)}% successfull recommendations`
                                    }
                                }
                            }
                        },
                        animation: {
                            onComplete: () => {
                                delayed = true;
                            },
                            delay: (context) => {
                                let delay = 0;
                                if (context.type === 'data' && context.mode === 'default' && !delayed) {
                                    delay = context.dataIndex * 10 + context.datasetIndex * 30;
                                }
                                return delay;
                            }
                        }
                    }}
                />
            }
            rest={
                <div>
                    <IntervalPicker
                        textFieldRefStart={textFieldRefStart}
                        onDateSelectedStart={onIntervalSelected}
                        defaultValueStart={startDate}
                        textFieldRefEnd={textFieldRefEnd}
                        onDateSelectedEnd={onIntervalSelected}
                        defaultValueEnd={endDate}
                        inputProps={{
                            inputProps: {
                                max: endDate,
                                min: startDate
                            }
                        }}
                    />
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showSMA}
                                    onChange={(event) => setShowSMA(event.target.checked)}
                                    inputProps={{'aria-label': 'controlled'}}
                                    style={{color: '#e0e0e0'}}
                                />
                            }
                            label="SMA"/>
                    </FormGroup>
                </div>
            }
        />
    )
}

export default OneAlgorithmRecommendations;