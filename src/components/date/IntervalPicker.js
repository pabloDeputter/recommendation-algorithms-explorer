import TextField from "@material-ui/core/TextField";
import React from "react";

export const IntervalPicker = ({
                                   textFieldRefStart,
                                   onDateSelectedStart,
                                   defaultValueStart,
                                   textFieldRefEnd,
                                   onDateSelectedEnd,
                                   defaultValueEnd,
                                   inputProps
                               }) => {
    return (
        <div>
            <form noValidate>
                <TextField
                    id="date"
                    label="StartDate"
                    type="date"
                    inputRef={textFieldRefStart}
                    onChange={onDateSelectedStart}
                    defaultValue={defaultValueStart}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    InputProps={
                        inputProps
                    }
                />
            </form>
            <form noValidate>
                <TextField
                    id="date"
                    label="EndDate"
                    type="date"
                    inputRef={textFieldRefEnd}
                    onChange={onDateSelectedEnd}
                    defaultValue={defaultValueEnd}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    InputProps={
                        inputProps
                    }
                />
            </form>
        </div>
    )
}