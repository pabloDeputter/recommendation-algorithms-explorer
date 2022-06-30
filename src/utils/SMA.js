export const sma = (raw_data, window_size, param_date, param_data) => {
    let i;
    let j;
    let sum = 0;
    let result = [];

    for (i = 0; i < window_size; i++) {
        sum += raw_data[i][param_data];
        let first_el_sum = 0;
        for (j = 0; j < i; j++) {
            first_el_sum += raw_data[j][param_data];
        }
        if (i === 0) {
            result.push({
                [param_date]: raw_data[i][param_date],
                [param_data]: raw_data[i][param_data]
            })
        } else {
            result.push({
                [param_date]: raw_data[i][param_date],
                [param_data]: first_el_sum / i
            })
        }

    }
    for (i = window_size; i < raw_data.length; i++) {
        sum -= raw_data[i - window_size][param_data];
        sum += raw_data[i][param_data];
        const avg = sum / window_size;
        result.push({
            [param_date]: raw_data[i][param_date],
            [param_data]: avg
        })
    }
    return result;
}

export const sma_muldata = (raw_data, window_size, param_date, param_data) => {
    let i;
    let result = {};
    for (i = 0; i < Object.keys(raw_data).length; i++) {
        result[Object.keys(raw_data)[i]] = sma(raw_data[Object.keys(raw_data)[i]], window_size, param_date, param_data)
    }
    console.log("test: ", raw_data, window_size, param_date, param_data)

    return result;
}