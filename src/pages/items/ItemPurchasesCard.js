// React
import React, {useRef, useState} from 'react';
// Stuff
import {CardComponent, Table} from '../../components';
import '../../components/card/UserCard.css'
import TextField from "@material-ui/core/TextField";

export const ItemPurchasesCard = (props) => {
    // PROPS
    const {name, sub_text, originalData, startDate, endDate, columns, param_date} = props;
    const [defaultStart, setDefaultStart] = useState(startDate);
    const [defaultEnd, setDefaultEnd] = useState(endDate);
    // DATA
    const [newData, setNewData] = useState(originalData);

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
        setDefaultStart(readTextFieldValueStart());
        setDefaultEnd(readTextFieldValueEnd());

        const data_filtered = originalData.filter((marker) => {
            const marker_date = new Date(marker[param_date]).toISOString().split('T')[0];
            return (marker_date >= defaultStart && marker_date <= defaultEnd)
        })
        setNewData(data_filtered);
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
                        <Table
                            data={newData}
                            columns={columns}
                        />
                    </div>
                }
                rest={
                    <div>
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
                        </div>
                    </div>
                }
            />
        </div>
    )
}