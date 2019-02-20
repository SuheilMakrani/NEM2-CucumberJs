Feature: Complete Aggregate transaction

    Scenario Outline: Initiating Complete Aggregate Transaction
        Given "<dan_privatekey>" sends transaction to "<alice_address>" and "<bob_address>"
        When Dan sends "<number>" of "<mosaic_name>"
        Then Dan announces the transaction on "<host_url>" should get the complete aggregate transaction hash

        Examples:
            | host_url                        | dan_privatekey                                                   | number    | mosaic_name | alice_address                            | bob_address                              |
            | http://catapult48gh23s.xyz:3000 | B6824BE72093E8BB3EF992F957539CF0D72522D37918A4B9224151C9F0B8B615 | 500000000 | xem:nem     | SDVVLDN5B65AWF36MW6J7I2GJGVK54T36DJJT6S3 | SC6HM5MMQZNJ63SMBRFJPKHQZANYLWEYUTG7G7R3 |