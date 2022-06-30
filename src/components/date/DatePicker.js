import TextField from "@material-ui/core/TextField";
import React from "react";

export const DatePicker = ({textFieldRef, onDateSelected, defaultValue}) => {
    return (
        <div>
            <form noValidate>
                <TextField
                    id="date"
                    label="Date"
                    type="date"
                    inputRef={textFieldRef}
                    onChange={onDateSelected}
                    defaultValue={defaultValue}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </form>
        </div>
    )
}