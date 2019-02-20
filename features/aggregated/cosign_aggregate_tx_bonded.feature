Feature: cosigning an aggregate bonded transaction

    Scenario Outline: cosign aggregate bonded transaction
        Given Alice needs to cosign any aggregate bonded transaction
        When fetching all aggregate bonded transaction to be signed with "<alice_privatekey>" from "<host_url>"
        Then Alice should cosign all pending transaction and announce the transaction

        Examples:
            | host_url                        | alice_privatekey                                                 |
            | http://catapult48gh23s.xyz:3000 | 8589CBBCBAF5046F4C47CC1A715A37BC20548B4A6A5F44564B23929E9782D968 |
