import React, { Component } from 'react';
import './MatchingRepeatInstances.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { removeMerge } from '../../../actions/REDCapLinterActions';

class MatchingRepeatInstances extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'Repeat Instrument',
          key: 'Repeat Instrument',
          render: (text, record) => (
            <div className="MatchingRepeatInstances-cellContainer">
              {record['Repeat Instrument']}
            </div>
          ),
        },
        {
          title: 'Instance',
          key: 'Instance',
          render: (text, record) => (
            <div className="MatchingRepeatInstances-cellContainer">{record.Instance}</div>
          ),
        },
        {
          title: 'Key',
          key: 'Key',
          render: (text, record) => (
            <div className="MatchingRepeatInstances-cellContainer">{record.Key}</div>
          ),
        },
      ],
    };
  }

  render() {
    const {
      workingSheetName,
      workingMergeRow,
      matchingRepeatInstances,
      reconciliationColumns,
      projectInfo,
    } = this.props;

    if (workingMergeRow < 0) {
      return null;
    }

    const repeatInstruments = projectInfo.repeatable_instruments || [];

    let matchingInstances = {};
    if (
      matchingRepeatInstances[workingSheetName]
      && matchingRepeatInstances[workingSheetName][workingMergeRow]
    ) {
      matchingInstances = matchingRepeatInstances[workingSheetName][workingMergeRow];
    }
    const tableData = [];
    repeatInstruments.forEach((repeatInstrument) => {
      const reconciliationFields = reconciliationColumns[repeatInstrument] || [];
      tableData.push({
        'Repeat Instrument': repeatInstrument,
        Instance: matchingInstances[repeatInstrument] || '',
        Key: reconciliationFields.join(', '),
      });
    });

    const { search, columns } = this.state;

    let data = tableData;
    if (search) {
      data = data.filter(
        row => row['Repeat Instance'].includes(search) || String(row.Instance).includes(search),
      );
    }
    return (
      <div className="MatchingRepeatInstances-table">
        <div className="MatchingRepeatInstances-tableTitle">
          <span className="MatchingRepeatInstances-searchBar">
            {'Search: '}
            <Input
              className="App-tableSearchBar"
              value={search}
              onChange={e => this.setState({ search: e.target.value })}
            />
          </span>
        </div>
        <Table
          size="small"
          columns={columns}
          dataSource={data}
          pagination={{ defaultPageSize: 5, showSizeChanger: true, showQuickJumper: true }}
        />
      </div>
    );
  }
}

MatchingRepeatInstances.propTypes = {
  matchingRepeatInstances: PropTypes.objectOf(PropTypes.object),
  reconciliationColumns: PropTypes.objectOf(PropTypes.array),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  workingSheetName: PropTypes.string,
  workingMergeRow: PropTypes.number,
};

MatchingRepeatInstances.defaultProps = {
  matchingRepeatInstances: {},
  reconciliationColumns: {},
  projectInfo: {},
  workingSheetName: '',
  workingMergeRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeMerge }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MatchingRepeatInstances);
