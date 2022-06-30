// React
import React, {useEffect, useRef, useState} from 'react';
// Stuff
import {CardComponent, IntervalPicker} from '../../components';
import '../../components/card/UserCard.css'
import {sma, sma_muldata} from '../../utils/SMA';
import {Button, Slider} from '@material-ui/core';
import {Chart as ChartJS, registerables} from 'chart.js'
import {Line} from 'react-chartjs-2';
import {renderParams} from "../../utils/renderParams";
import {PrettyNumbers} from "../../utils/PrettyNumbers";

ChartJS.register(...registerables)

// UPDATE TOTAL DATA
const calculateTotal = (data, param_data) => {
    let total = 0;
    data.forEach(item => total += item[param_data])
    return total;
}

export const TestGraphCard = (props) => {
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
        sma_bg,
        buttonText,
        ctr
    } = props;
    // GRAPH DATE
    const [graphData, setGraphData] = useState(data);
    const [movingAverage, setMovingAverage] = useState(data.length >= 1 ? sma(data, 1, param_date, param_data) : data)
    const [totalCount, setTotalCount] = useState(calculateTotal(data, param_data));
    // SLIDER
    const [sliderValue, setSliderValue] = useState(data.length === 1 ? 1 : 2);
    const [sliderMaxValue, setSliderMaxValue] = useState(data.length);
    const [hideText, setHideText] = useState(buttonText !== undefined);
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
        if (diffDays < data.length) {
            setSliderMaxValue(diffDays);
        } else {
            setSliderMaxValue(data.length);
        }
        const new_graphdata = data.filter((marker) => {
            const purchase_date = new Date(marker[param_date]).toISOString().split('T')[0];
            return (purchase_date >= from && purchase_date <= to)
        })
        setSliderMaxValue(new_graphdata.length);
        setGraphData(new_graphdata);
        const temp_total = calculateTotal(new_graphdata, param_data);
        setTotalCount(temp_total);
    }

    // UPDATE MOVING AVERAGE ACCORDING TO THE SLIDER VALUE
    useEffect(() => {
        // if (!big){
        //     setSliderValue(10);
        // }
        // else{
        if (sliderValue > sliderMaxValue) {
            setSliderValue(sliderMaxValue);
        }

        graphData.length > 1 ? setMovingAverage(sma(graphData, sliderValue, param_date, param_data)) : setMovingAverage(graphData);
    }, [sliderValue, sliderMaxValue]);

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
        big ? <CardComponent
                title={name}
                link=''
                text={
                    <div>
                        <div style={{display: 'inline'}}>
                            <div className="user-card-metadata-key">TOTAL</div>
                            <div
                                className="user-card-metadata-val">{PrettyNumbers(Math.round((totalCount + Number.EPSILON) * 100) / 100)}</div>
                            {
                                !ctr ? null
                                    :
                                    <div>
                                        <div className="user-card-metadata-key">CTR</div>
                                        <div
                                            className="user-card-metadata-val">{PrettyNumbers(Math.round(((totalCount / graphData.length) + Number.EPSILON) * 100) / 100)}</div>
                                    </div>
                            }
                        </div>
                        <div>
                            <div style={{textAlign: 'left'}} className="user-card-metadata-key"> SMA WINDOW SIZE
                                : {sliderValue} </div>
                            <Slider
                                className="float-start m-auto flex-grow-0"
                                value={sliderValue}
                                onChange={(e, ee) => setSliderValue(ee)}
                                min={1}
                                max={sliderMaxValue}
                            />
                        </div>
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
                                    data: graphData.map((item) => {
                                        return (item[param_data])
                                    }),
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
                              fill: true,
                              maintainAspectRatio: true,
                              responsive: true,
                              interaction: {
                                  mode: 'index'
                              },
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
                              plugins: {
                                  legend: {
                                      display: false
                                  },
                              },
                              scales: {
                                  x: {
                                      ticks: {
                                          display: false
                                      }
                                  },
                                  y: {
                                      ticks: {
                                          display: false
                                      }
                                  },
                              }
                          }}
                    />
                }
            />
    )
}

export const TestGraphCard_Mul = (props) => {
    // PROPS
    const {
        name,
        graphnames,
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
    const [movingAverage, setMovingAverage] = useState(sma_muldata(data, 1, param_date, param_data))
    // SLIDER
    const [sliderValue, setSliderValue] = useState(data[Object.keys(data)[0]].length === 1 ? 1 : 2);
    const [sliderMaxValue, setSliderMaxValue] = useState(data[Object.keys(data)[0]].length);
    const [sliderMax, setSliderMax] = useState(data[Object.keys(data)[0]].length);
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
        let new_graphdata = {};
        Object.keys(data).forEach((key) => {
            console.log(graphData[key], Object.keys(data))
            new_graphdata[key] = (data[key].filter((marker) => {
                const purchase_date = new Date(marker[param_date]).toISOString().split('T')[0];
                return (purchase_date >= from && purchase_date <= to)
            }))
        })
        console.log(new_graphdata)

        setSliderMaxValue(new_graphdata[Object.keys(graphData)[0]].length);
        setGraphData(new_graphdata);
        setMovingAverage(sma_muldata(new_graphdata, sliderValue, param_date, param_data))
    }

    // UPDATE MOVING AVERAGE ACCORDING TO THE SLIDER VALUE
    useEffect(() => {
        if (sliderValue > sliderMaxValue) {
            setSliderValue(sliderMaxValue);
        }

        setMovingAverage(sma_muldata(data, sliderValue, param_date, param_data));
    }, [sliderValue, sliderMaxValue])

    let delayed;

    function newcollor(index) {
        if (index % 5 === 0) {
            return 'rgba(80,120,205, 0.7)'
        } else if (index % 5 === 1) {
            return 'rgba(56,104,144, 0.7)'
        } else if (index % 5 === 2) {
            return 'rgba(99,96,205, 0.7)'
        } else if (index % 5 === 3) {
            return 'rgba(80,205,155, 0.7)'
        } else if (index % 5 === 4) {
            return 'rgba(56,144,108, 0.7)'
        }
    }

    function newcollor_sma(index) {
        if (index % 5 === 0) {
            return 'rgb(242,92,84)'
        } else if (index % 5 === 1) {
            return 'rgb(169,63,59)'
        } else if (index % 5 === 2) {
            return 'rgb(241,150,84)'
        } else if (index % 5 === 3) {
            return 'rgb(241,84,191)'
        } else if (index % 5 === 4) {
            return 'rgb(169,59,134)'
        }
    }

    const getDatasets = () => {
        let temps = [];
        Object.keys(graphnames).map((key, index) => {
                temps.push({
                    label: `sma ${graphnames[key]["name"]} #${graphnames[key]["id"]}`,
                    fill: false,
                    data: movingAverage[graphnames[key]['id']].map((item) => item[param_data]),
                    backgroundColor: [newcollor_sma(index)],
                    borderColor: newcollor_sma(index),
                    borderWidth: 1
                });
            }
        )
        Object.keys(graphnames).map((key, index) => {
                temps.push({
                    label: `${graphnames[key]["name"]} #${graphnames[key]["id"]}`,
                    data: graphData[graphnames[key]['id']].map((item) => item[param_data]),
                    backgroundColor: [newcollor(index)],
                    borderColor: data_border,
                    borderWidth: 1
                });
            }
        )
        return temps;
    }


    return (
        big ? <CardComponent
                title={name}
                link=''
                text={
                    <div>
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
                             className="user-card-metadata-key d-none d-lg-block"
                        >
                            {sub_text}
                        </div>
                    </div>
                }
                content={
                    <Line type='line' data={
                        {
                            labels: graphData[Object.keys(graphData)[0]].map((item) => new Date(item[param_date]).toISOString().split('T')[0]),
                            datasets: [...getDatasets()],
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
                            labels: graphData[Object.keys(graphData)[0]].map((item) => new Date(item[param_date]).toISOString().split('T')[0]),
                            datasets: [...getDatasets()],
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
                              plugins: {
                                  legend: {
                                      display: false
                                  },
                              },
                              scales: {
                                  x: {
                                      ticks: {
                                          display: false
                                      }
                                  },
                                  y: {
                                      ticks: {
                                          display: false
                                      }
                                  },
                              }
                          }}
                    />
                }
            />
    )
}