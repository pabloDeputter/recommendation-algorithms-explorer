// React
import React, {useEffect, useRef, useState} from 'react';
// Stuff
import {CardComponent, IntervalPicker} from '../../components';
import '../../components/card/UserCard.css'
import {sma} from '../../utils/SMA';
import {Slider} from '@material-ui/core';
import {Line} from 'react-chartjs-2';
import {PrettyNumbers} from "../../utils/PrettyNumbers";
import {Chart as ChartJS, registerables} from "chart.js";

ChartJS.register(...registerables)

// UPDATE TOTAL DATA
const calculateTotal = (data, param_data) => {
    let total = 0;
    data.forEach(item => total += item[param_data])
    return total;
}

export const UserGraphCard = (props) => {
    // PROPS
    const {
        name,
        sub_text,
        data,
        startDate,
        endDate,
        param_date,
        param_data,
        big,
        data_border,
        data_bg,
        sma_border,
        sma_bg
    } = props;

    // GRAPH DATE
    const [graphData, setGraphData] = useState(data);
    const [movingAverage, setMovingAverage] = useState(sma(data, 1, param_date, param_data))
    const [totalCount, setTotalCount] = useState(calculateTotal(data, param_data));
    // SLIDER
    const [sliderValue, setSliderValue] = useState(data.length === 1 ? 1 : 2);
    const [sliderMaxValue, setSliderMaxValue] = useState(data.length);
    const [sliderMax, setSliderMax] = useState(data.length);
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
        if (diffDays < sliderMax) {
            setSliderMaxValue(diffDays)
        } else {
            setSliderMaxValue(sliderMax)
        }
        const new_graphdata = data.filter((marker) => {
            const purchase_date = new Date(marker[param_date]).toISOString().split('T')[0];
            return (purchase_date >= from && purchase_date <= to)
        })
        setGraphData(new_graphdata);
        setTotalCount(calculateTotal(graphData, param_data));
    }

    // UPDATE MOVING AVERAGE ACCORDING TO THE SLIDER VALUE
    useEffect(() => {
        if (sliderValue > sliderMaxValue) {
            setSliderValue(sliderMaxValue);
        }
        setMovingAverage(sma(graphData, sliderValue, param_date, param_data));
    }, [sliderValue, sliderMaxValue])

    let delayed;

    return (
        big ? <CardComponent
                title={name}
                link=''
                text={
                    <div>
                        <div className="user-card-metadata-key">TOTAL</div>
                        <div
                            className="user-card-metadata-val">{PrettyNumbers(Math.round((totalCount + Number.EPSILON) * 100) / 100)}</div>
                        <div>
                            <div style={{textAlign: 'left'}} className="user-card-metadata-key"> SMA WINDOW SIZE
                                : {sliderValue} </div>
                            <Slider
                                style={{maxWidth: 450, position: 'relative', margin: 'auto', textAlign: 'left'}}
                                value={sliderValue}
                                onChange={(e, ee) => setSliderValue(ee)}
                                min={1}
                                max={sliderMaxValue}
                            />
                        </div>
                        <div style={{textAlign: 'left', maxWidth: 500, wordBreak: 'break-word'}}
                             className="user-card-metadata-key">
                            {sub_text}
                        </div>
                    </div>
                }
                content={
                    <Line type='line' data={
                        {
                            labels: graphData.map((item) => new Date(item[param_date]).toISOString().split('T')[0]),
                            datasets: [
                                {
                                    label: 'SMA',
                                    fill: false,
                                    data: movingAverage.map((item) => item[param_data]),
                                    backgroundColor: sma_bg,
                                    borderColor: sma_border,
                                    borderWidth: 1.75
                                },
                                {
                                    label: name,
                                    data: graphData.map((item) => item[param_data]),
                                    backgroundColor: [
                                        data_bg
                                    ],
                                    borderColor: data_border,
                                    borderWidth: 1.25
                                }
                            ],
                        }
                    }
                          options={{
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
                              },
                              fill: true,
                              maintainAspectRatio: true,
                              responsive: true,
                              pan: {
                                  enabled: true,
                                  mode: "yx",
                                  speed: 5,
                                  threshold: 2,
                                  rangeMin: {
                                      y: 0
                                  }
                              },
                              zoom: {
                                  enabled: true,
                                  mode: "x",
                                  speed: 5,
                                  threshold: 2,
                              }
                          }}
                    />

                }
                rest={
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
                }
            /> :
            <CardComponent
                title={name}
                content={
                    <Line type='line' data={
                        {
                            labels: graphData.map((item) => new Date(item[param_date]).toISOString().split('T')[0]),
                            datasets: [
                                {
                                    label: name,
                                    data: graphData.map((item) => item[param_data]),
                                    backgroundColor: [
                                        data_bg
                                    ],
                                    borderColor: data_border,
                                    borderWidth: 1
                                },
                                {
                                    label: 'SMA',
                                    fill: false,
                                    data: movingAverage.map((item) => item[param_data]),
                                    backgroundColor: sma_bg,
                                    borderColor: sma_border,
                                    borderWidth: 1,
                                }
                            ],
                        }
                    }
                          options={{
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
                              },
                              legend: {
                                  display: false //This will do the task
                              },
                              scales: {
                                  xAxes: [{
                                      ticks: {
                                          display: false // hide x as
                                      },
                                      gridLines: {
                                          drawOnChartArea: false
                                      }
                                  }],
                                  yAxes: [{
                                      ticks: {
                                          display: false // hide y as
                                      },
                                      gridLines: {
                                          drawOnChartArea: false
                                      }
                                  }],
                                  y: {
                                      suggestedMin: 100
                                  }
                              },
                          }}
                    />
                }
            />
    )
}