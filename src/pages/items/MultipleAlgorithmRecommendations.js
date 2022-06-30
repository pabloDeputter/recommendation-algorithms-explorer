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

// UPDATE TOTAL DATA
const calculateTotal = (data, param_data) => {
    let total = 0;
    data.forEach(item => total += item[param_data])
    return total;
}

const MultipleAlgorithmRecommendations = (props) => {
    // PROPS
    const {name, sub_text, data, startDate, labels, datasets, endDate, param_date, param_data, buttonText} = props;

    // CHART LEGEND
    let selectedLegend = datasets.map((item) => (
        {
            label: item['label'],
            show: true
        }
    ))

    // DATA
    const [graphData, setGraphData] = useState(data);
    const [movingAverage, setMovingAverage] = useState(data.map((item, index) => (
        sma(data[index], 1, param_date, param_data)
    )));
    const [stacked, setStacked] = useState(false);
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
                const purchase_date = new Date(marker[param_date]).toISOString().split('T')[0];
                return (purchase_date >= from && purchase_date <= to)
            }))
        })

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
    }, [sliderValue, sliderMaxValue])

    const getTotal = (raw_data) => {
        let total = [];
        let i = 0;
        while (i < raw_data[0].length) {
            let temp = 0;
            raw_data.forEach((item, index) => {
                if (selectedLegend[index].show) {
                    temp += item[i][param_data];
                }
            })
            total.push(temp);
            i++;
        }
        return total;
    }

    const getDatasets = () => {
        let temps = [];
        datasets.map((item, index) => {
            if (showSMA) {
                const temp_sma = structuredClone(datasets[index]);
                const temp_sma_data = movingAverage[index].map((item) => {
                    return item[param_data];
                })
                temp_sma.label = temp_sma.label;
                temp_sma.data = temp_sma_data;
                temp_sma.borderColor = datasets[index]['borderColor'];
                temp_sma.backgroundColor = datasets[index]['backgroundColor'];
                temps.push(temp_sma);
            } else {
                let temp = structuredClone(item);
                temp.data = graphData[index].map((item) => {
                    return item[param_data];
                })
                // temp.stack = 'false';
                // if (!stacked) {
                //     temp.stack = 'false';
                // }
                // else {
                //     temp.stack = 'combined';
                // }
                temps.push(temp);
            }
        })
        temps.push({
            label: 'total',
            data: showSMA ? getTotal(movingAverage) : getTotal(graphData),
            type: 'line',
            borderColor: '#f55964',
            backgroundColor: 'transparent',
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
                        {/*{*/}
                        {/*    datasets.map((item, index) => (*/}
                        {/*        <div*/}
                        {/*            key={index}*/}
                        {/*            className="user-card-metadata-key">*/}
                        {/*            {`TOTAL ${item['label']} - `}*/}
                        {/*            <span*/}
                        {/*                className="user-card-metadata-val">{PrettyNumbers(Math.round((showSMA ? calculateTotal(movingAverage[index], param_data) : calculateTotal(graphData[index], param_data) + Number.EPSILON) * 100) / 100)}</span>*/}
                        {/*        </div>*/}
                        {/*    ))*/}
                        {/*}*/}
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
                        scales: {
                            x: {
                                stacked: stacked,
                            },
                            y: {
                                stacked: stacked,
                            },
                        },
                        fill: true,
                        maintainAspectRatio: true,
                        responsive: true,
                        interaction: {
                            mode: 'index'
                        },
                        plugins: {
                            legend: {
                                onClick: (evt, legendItem, legend) => {
                                    const index = legendItem.datasetIndex;
                                    const ci = legend.chart;
                                    const meta = ci.getDatasetMeta(index);

                                    // Hide the chart
                                    if (legendItem.text !== 'total') {
                                        selectedLegend.find(item => item.label === legendItem.text).show = meta.hidden !== null;
                                    }

                                    meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;

                                    ci.update();
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
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={stacked}
                                    onChange={(event) => setStacked(event.target.checked)}
                                    inputProps={{'aria-label': 'controlled'}}
                                    label="Stacked"
                                    style={{color: '#e0e0e0'}}
                                />
                            }
                            label="Stacked"/>
                    </FormGroup>
                </div>
            }
        />
    )
}

export default MultipleAlgorithmRecommendations;